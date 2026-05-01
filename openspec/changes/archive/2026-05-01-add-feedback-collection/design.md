# add-feedback-collection — Design

## Context

VeggieScan 的成分分類由 `src/lib/classifier.ts` 兩階段執行：先嘗試對 `src/lib/ingredient-matcher.ts` 的本地資料庫做精確 / 別名比對，未命中的成分再交給 Gemini 做 AI 補強。兩個來源都可能誤判，但目前 UI（`src/components/IngredientGroup.tsx`、`ResultDisplay.tsx`）是單向展示，沒有任何回饋管道。

部署環境是 Vercel serverless（見專案記憶 `project_deployment_platform`），任何長駐程式都無法持續存活；既有的 rate-limit（`src/lib/rate-limit.ts`）是 in-memory single-bucket 設計（30 req/hr/IP），保護 `/api/ocr`、`/api/parse`、`/api/analyze`，並已在 `openspec/changes/add-rate-limit/design.md` 規劃 Phase 2 升級到 Vercel KV。

本次目標是用最小成本提供「使用者勾選錯誤成分 → 寄信通知維運」的端到端能力，**不引入持久化儲存**，把信箱當作 inbox 用。流量假設極低（個位數 / 天）。

## Goals / Non-Goals

**Goals:**

- 使用者可以在結果頁逐筆勾選認為錯誤的成分、補充原因、選擇性建議正確分類，一次送出。
- API 端能接收 payload、進行基本驗證、套用 rate-limit、寄信給維運人員。
- 寄出的信件包含足夠上下文，使維運人員不需要再向使用者要資料就能判斷是否採納。
- 濫用防護：feedback 端點與既有受保護端點獨立計算配額，避免單一濫用者把 Resend 額度燒光、或把 analyze quota 拖垮。

**Non-Goals:**

- 不做持久化（Vercel KV / DB / 外部服務）。
- 不做 admin 介面、不做使用者通知、不自動修改資料庫。
- 不做 captcha、不做 honeypot、不做 IP block list。
- 不替代既有 rate-limit Phase 2 KV 升級（兩條路線各自演進）。

## Decisions

### Resend over Gmail SMTP / 其他 transactional email service

採用 Resend SDK（npm `resend`），透過 HTTP API 寄信。

**Rationale:**
- Vercel serverless 上 SMTP 連線需要每次 cold start 重建，HTTP API 較自然。
- Gmail SMTP 會把 app 寄信流量綁到使用者個人主帳號，存在「信譽污染」「異常活動鎖帳號」「達 500 封/天上限影響個人寄信」「ToS 灰色地帶」等隱性風險。
- Resend 免費額度 3000 封/月，遠超 Phase 1 預期流量。可使用 `onboarding@resend.dev` 不綁自有 domain。
- SendGrid / Mailgun 設定較重，免費額度限制更嚴格，無明顯優勢。

### Email-only Phase 1（不引入儲存層）

寄信即儲存，不寫 KV / DB / 外部表。

**Rationale:**
- Phase 1 主要驗證「有沒有人會用、回報內容長什麼樣」，需求不確定階段引入儲存層是過早最佳化。
- Email inbox 天然支援搜尋、標記、轉寄、討論，對個位數 / 天的流量是足夠的。
- 後續若量爆增或需要量化分析，再評估升級 KV / 外部 service。

### Feedback rate-limit 採獨立 bucket，10 req/hr/IP

不沿用現有的 30 req/hr 共用 bucket。

**Rationale:**
- Feedback 的合理頻率遠低於 analyze。一個善意使用者一次 session 最多送一兩次，10/hr 已過度寬鬆。
- 共用 bucket 會讓「正常分析使用者偶爾送回報」也吃掉 analyze quota，體驗不對。
- 獨立 bucket 隔離濫用風險：即使有人 spam feedback，也不會影響其他使用者使用 analyze。
- 實作上把 `rate-limit.ts` 的 `Map<ip, Entry>` 改為 `Map<bucketKey, Map<ip, Entry>>`，或是更簡單地把 `checkRateLimit` 簽名改為 `checkRateLimit(request, options?)`，options 包含 `bucket: string`、`maxRequests: number`。預設值維持現有行為不破壞既有呼叫端。

### Modal 互動而非 inline 編輯

按下「回報有誤」開 modal，而非在每列展開細節編輯區。

**Rationale:**
- inline 展開會讓本來簡潔的結果列變擁擠、且 mobile 上難操作。
- modal 強制使用者「集中精神 review 勾選結果再送出」，避免誤觸。
- modal 也方便集中放「自由文字補充」「建議分類下拉」等選填欄位。

### Email payload 內容

寄出的信件 plain text 包含：
- 時間戳記（ISO 8601 + Asia/Taipei）
- 客戶端 IP（截斷後 8 字元用於追蹤同一使用者多次回報，但不完整顯示以保留隱私）
- 使用者選的 dietType
- 完整 ingredient list（原文 / 分類 / source / description），讓維運人員看見完整上下文
- 被勾選為「可能有誤」的成分（高亮列出）
- 使用者建議的正確分類（若有）
- 使用者自由文字補充（若有）

**Rationale:**
- 沒有完整 ingredient list 就無法判斷錯誤是孤立還是模式（例如同一系列產品都誤判）。
- 自由文字最重要，是 actionable 的訊號來源。
- IP 部分截斷在隱私與「能否識別重複惡意提交」間取平衡。

### Payload 驗證原則

API 收到 payload 後做以下驗證，任一失敗回 400：
- Body 必須是 JSON 物件
- `ingredients` 為非空陣列，每個元素需包含 `originalText`、`category`、`source`
- `flaggedIndices` 為非空整數陣列，每個值需在 `ingredients` 範圍內
- `dietType` 屬於 `VegetarianType` 列舉
- `userNote`（選填）為字串，長度 ≤ 1000
- `suggestedCategory`（選填）屬於 `IngredientCategory` 列舉
- 整個 payload 序列化後 ≤ 30 KB（避免被當成 abuse vector）

### 環境變數與失敗策略

- `RESEND_API_KEY`：未設定時 API 直接回 500 並寫入 `console.error`，不嘗試替代寄信通道。
- `FEEDBACK_RECIPIENT_EMAIL`：未設定時退回硬編碼 fallback `mooshi21824@gmail.com`，並 `console.warn`。
- Resend API call 失敗時：回 500 並把錯誤訊息（不含 API key）log 到 `console.error`。**不重試**（Phase 1 簡化，使用者可手動再送）。

## Risks / Trade-offs

- **[沒有持久化導致信件遺失]** → Mitigation：用 Gmail 的標籤 / 轉寄規則、定期手動匯出。Phase 2 視量再評估升級 KV。
- **[Resend onboarding domain 寄出的信被收件人 Gmail 標為垃圾信]** → Mitigation：收件人是固定的 `mooshi21824@gmail.com`，使用者可手動將 `onboarding@resend.dev` 加入聯絡人；若大量丟入 spam，再升級綁自有 domain（DNS / DKIM / SPF）。
- **[惡意使用者 spam 端點，10/hr 仍可能填滿 inbox]** → Mitigation：rate-limit 已將單 IP 上限壓到合理值；極端情況可加 IP block list 或暫時下架端點。Phase 2 加 captcha 視量決定。
- **[in-memory rate-limit 在 serverless 上是 best-effort]** → Mitigation：與既有 analyze rate-limit 同一已知限制，不在本次解決，等 Phase 2 KV 統一升級。
- **[使用者送出後沒有確認回信，可能重複送]** → Mitigation：modal 送出後顯示明確成功訊息與「已收到回報」狀態，並 disable 重新送出按鈕一段時間（或直接關閉 modal）。
- **[新增 npm 依賴 resend 增加 bundle / cold start]** → Mitigation：僅在 `/api/feedback` route 端 import，不影響前端 bundle。Resend SDK 體積小，serverless cold start 影響可忽略。

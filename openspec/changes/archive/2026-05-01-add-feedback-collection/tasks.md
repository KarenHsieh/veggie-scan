## 1. 環境與依賴準備

- [x] 1.1 安裝 `resend` npm 依賴（對應 design 決策「Resend over Gmail SMTP / 其他 transactional email service」）
- [x] 1.2 在 `.env.example` 加入 `RESEND_API_KEY` 與 `FEEDBACK_RECIPIENT_EMAIL`，並更新 README 部署章節說明 Vercel Environment Variables 設定步驟（對應 design「環境變數與失敗策略」）
- [x] 1.3 確認本次不引入任何持久化儲存（資料庫 / Vercel KV / 外部 service），符合 design「Email-only Phase 1（不引入儲存層）」的範圍邊界

## 2. Rate-limit 多 bucket 重構

- [x] 2.1 修改 `src/lib/rate-limit.ts`，支援多個獨立 bucket：將 `checkRateLimit` 簽名擴充為接收 `options?: { bucket?: string; maxRequests?: number }`，預設 bucket 為現有行為以保持 `/api/ocr` `/api/parse` `/api/analyze` 不變（對應 design「Feedback rate-limit 採獨立 bucket，10 req/hr/IP」與 spec 需求「Independent quota bucket for the feedback endpoint」）
- [x] 2.2 在 `src/lib/rate-limit.test.ts` 新增 feedback bucket 專屬測試：10/hr 限制、第 11 次回 429、與 analyze bucket 互不干擾、開發環境繞過、視窗到期重置
- [x] 2.3 確認既有 analyze 測試案例仍通過，未因為 multi-bucket 重構回歸

## 3. Feedback API endpoint 實作

- [x] 3.1 建立 `src/app/api/feedback/route.ts`，套用 feedback 專屬 rate-limit（10/hr/IP），實作 spec 需求「Feedback API endpoint contract」中的 200/400/429/500 行為
- [x] 3.2 實作 payload 驗證邏輯：必填欄位（`ingredients`、`flaggedIndices`、`dietType`）、enum 範圍（`IngredientCategory`、`VegetarianType`）、`userNote` ≤ 1000 字、序列化後 ≤ 30 KB、`flaggedIndices` 元素需在範圍內（對應 design「Payload 驗證原則」）
- [x] 3.3 在 `src/types/ingredients.ts` 新增 `FeedbackPayload` 型別，並在前後端共用
- [x] 3.4 撰寫 API route 整合測試，覆蓋成功送出（200）、各 400 錯誤碼（`invalid_payload`、`empty_feedback`、`payload_too_large`）、429（rate limit）、500（Resend 失敗 / 缺 API key）

## 4. Resend 寄信封裝

- [x] 4.1 建立 `src/lib/feedback-email.ts`，封裝 Resend SDK 呼叫，實作 spec 需求「Email notification delivery」（含寄件位址 fallback 與 `RESEND_API_KEY` 缺失行為）
- [x] 4.2 實作 email 內容組裝：Asia/Taipei ISO 8601 時間戳、`IP#<sha256前8字元>` 識別碼、`dietType`、Flagged ingredients 區段、Full ingredient list 區段、選填 `userNote` 與 `suggestedCategory`（對應 design「Email payload 內容」與 spec 需求「Email content includes flagged-vs-context distinction」）
- [x] 4.3 實作環境變數退回邏輯：`FEEDBACK_RECIPIENT_EMAIL` 缺失時 fallback 到 `mooshi21824@gmail.com` 並 `console.warn`；`RESEND_API_KEY` 缺失時直接讓 API 回 500 並 `console.error`，不嘗試替代通道
- [x] 4.4 撰寫 `feedback-email` 單元測試：mock Resend client，驗證 email subject / from / to / body 結構正確、IP hash 為前 8 字元、flagged 與 full 區段正確分開

## 5. 結果頁勾選 UI

- [x] 5.1 在 `src/components/IngredientGroup.tsx` 為每列加入 checkbox 控制（不論 `source` 為 `database` 或 `ai` 都顯示），實作 spec 需求「Per-ingredient feedback selection control」；勾選狀態以受控元件方式由父層管理
- [x] 5.2 在 `src/components/ResultDisplay.tsx` 管理 `Set<number>` 形式的勾選 state、新增「回報有誤」按鈕作為 spec 需求「Feedback submission entry point」中描述的入口；按鈕永遠 enabled
- [x] 5.3 驗證群組收合 / 展開、切換 dietType 時，勾選狀態維持不變（不被重置）

## 6. 回報 modal 與送出流程

- [x] 6.1 建立 `src/components/FeedbackModal.tsx`，採 modal 形式呈現（對應 design「Modal 互動而非 inline 編輯」），支援 ESC 與背景點擊關閉
- [x] 6.2 實作 modal 內欄位：可再調整的勾選成分清單、`userNote` 多行文字輸入（顯示字數上限 1000）、選填的「建議正確分類」下拉（六類 `IngredientCategory`），實作 spec 需求「User feedback submission flow」
- [x] 6.3 實作送出邏輯：`fetch('/api/feedback', { method: 'POST', body: JSON.stringify(payload) })`，依回應顯示成功 / 失敗 / rate-limited 訊息；送出中按鈕 disabled
- [x] 6.4 成功（200）後顯示成功訊息，使用者關閉 modal 時清除 `ResultDisplay` 的勾選 state
- [x] 6.5 取消或關閉 modal 時不發 API 請求、不重置 `ResultDisplay` 已勾選狀態

## 7. 端到端驗收與文件

- [x] 7.1 本機以 `NODE_ENV=production` 啟動跑完整流程：拍照 / 輸入 → 結果頁 → 勾選兩筆 → 開 modal → 送出 → 確認 `mooshi21824@gmail.com` 收到信件、內容包含 Flagged 區段與 Full ingredient list
- [x] 7.2 驗收 feedback rate-limit：在 production 模式下連續 POST 11 次 `/api/feedback`，第 11 次回 429 且帶 `Retry-After`
- [x] 7.3 驗收 bucket 隔離：先把 analyze bucket 用滿至 30，再送 1 次 feedback 應成功；反向亦然
- [x] 7.4 更新 `README.md` 加入 feedback 功能簡介與相關環境變數說明

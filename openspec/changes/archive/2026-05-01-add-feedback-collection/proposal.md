# add-feedback-collection

## Why

成分分類由「資料庫比對 + AI 補強」混合產生，AI 判定可能誤分、資料庫條目也可能有誤，但目前沒有任何回報管道。使用者只能默默接受結果，開發者也無法知道哪些分類錯了。建立輕量的回報管道，可以收集 actionable 的錯誤訊號用來改善資料庫與 prompt。

Phase 1 採「使用者勾選 + 寄信通知」的最小實作，先驗證有沒有人會用、回報內容長什麼樣，再決定要不要做持久化儲存。

## What Changes

- **UI（修改 `result-display`）**：每筆成分列右側新增 checkbox（資料庫與 AI 來源都可勾選）。`ResultDisplay` 底部新增「回報有誤」按鈕，按下開啟 modal 收集：
  - 已勾選的成分（自動帶入，使用者可再調整）
  - 自由文字補充欄位
  - 選填的「建議正確分類」下拉（六類：non-vegetarian / five-pungent / egg / dairy / ambiguous / vegetarian）
  - 送出 / 取消
- **API（新 capability `feedback-collection`）**：新增 `POST /api/feedback`，接收回報內容，呼叫 Resend SDK 寄信給維運人員，回傳 200/400/429/500。
- **寄信**：使用 Resend SDK，寄件位址用 Resend 預設的 `onboarding@resend.dev`（不綁自有 domain），收件位址 `mooshi21824@gmail.com`，內容包含被勾選成分（原文 + 目前分類 + source）、完整 ingredient list、dietType、使用者註解、建議分類、時間戳記。
- **Rate limiting（修改 `rate-limiting`）**：`/api/feedback` 採用獨立的 quota bucket，**10 requests / 1 小時 / IP**（比 analyze 嚴格，因為濫用會浪費 Resend 額度與信箱）。
- **環境變數**：新增 `RESEND_API_KEY`、`FEEDBACK_RECIPIENT_EMAIL`。

## Non-Goals

- **持久化儲存**：不寫入 Vercel KV、資料庫或外部 service。Phase 1 僅靠 email inbox 作為「儲存」。
- **Admin / dashboard 介面**：不提供 UI 給維運人員瀏覽彙整回報。
- **使用者登入或身份識別**：匿名提交，不蒐集 email、不要求註冊。
- **回信給使用者 / 自動更新分類**：不告知使用者「你的回報已採納」、不自動修改資料庫，所有採納流程由維運人員手動處理。
- **改用 Gmail SMTP / 自架寄信**：考量過 Nodemailer + Gmail SMTP，因為個人 Gmail 帳號信譽污染風險與 App Password credentials 管理問題而排除。

## Capabilities

### New Capabilities

- `feedback-collection`：使用者對成分分析結果提交錯誤回報的端到端能力，包含 UI 觸發點、API endpoint、寄信通知與 rate-limit 行為的對外契約。

### Modified Capabilities

- `result-display`：原本是純展示的結果頁，新增「可勾選 + 觸發回報 modal」的互動行為。
- `rate-limiting`：新增 `/api/feedback` 至受保護端點清單，並引入「獨立 bucket、不同配額」的概念（既有的 `/api/ocr`、`/api/parse`、`/api/analyze` 共用一個 bucket，feedback 自成一桶）。

## Impact

- **新增程式碼**：
  - `src/app/api/feedback/route.ts`（新 API endpoint）
  - `src/lib/feedback-email.ts`（Resend 寄信封裝）
  - `src/components/FeedbackModal.tsx`（回報 modal）
- **修改程式碼**：
  - `src/components/IngredientGroup.tsx`（每列加 checkbox、把勾選狀態提升給上層）
  - `src/components/ResultDisplay.tsx`（管理勾選狀態、加「回報有誤」按鈕、掛 modal）
  - `src/lib/rate-limit.ts`（支援多個獨立 bucket，或新增 feedback 專用 bucket）
  - `src/types/ingredients.ts`（可能新增 `FeedbackPayload` 等型別）
- **新依賴**：`resend` npm package。
- **新環境變數**：`RESEND_API_KEY`、`FEEDBACK_RECIPIENT_EMAIL`（部署前需設置於 Vercel Environment Variables）。
- **無資料庫 / migration 影響**。

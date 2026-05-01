# VeggieScan 🌿

素食成分掃描器 — 拍照或輸入食品成分，即時判斷是否符合你的素食類型。

## 功能特色

- **拍照辨識**：上傳食品包裝照片，透過 OCR 自動擷取成分文字
- **自由裁切**：上傳後可自由調整裁切範圍，精確框選成分標示區域
- **手動輸入**：也可直接貼上或輸入成分文字
- **智慧分類**：內建 100+ 筆常見成分資料庫，搭配 AI 辨識未知成分
- **五種素食類型**：全素、蛋素、奶素、蛋奶素、五辛素，即時切換即時判定
- **分類結果一目瞭然**：成分依動物性、五辛、蛋奶、無法確定、全素分組顯示
- **回報分類有誤**：勾選結果頁可疑成分，補上說明後一鍵寄信通知維運
- **響應式設計**：手機、平板、桌面皆適用

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + CSS custom properties
- **AI**: Google Gemini 2.5 Flash（OCR、成分解析、分類）
- **Image Cropping**: react-cropper (Cropper.js)
- **Email**: [Resend](https://resend.com)（回報功能寄信）
- **Testing**: Vitest + React Testing Library

## 快速開始

### 環境需求

- Node.js 18+
- npm

### 安裝與啟動

```bash
# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env.local
# 編輯 .env.local，填入你的 Gemini API Key
```

`.env.local` 需包含：

```
GEMINI_API_KEY=your_gemini_api_key_here
RESEND_API_KEY=your_resend_api_key_here   # 回報功能寄信使用
# FEEDBACK_RECIPIENT_EMAIL=               # 選填，預設 mooshi21824@gmail.com
```

> Gemini API Key 可至 [Google AI Studio](https://aistudio.google.com/apikey) 免費申請。
> Resend API Key 可至 [Resend](https://resend.com) 註冊免費帳號取得（免費額度 3000 封/月）。

### 部署到 Vercel

於 Vercel 專案的 **Settings → Environment Variables** 加入：

| 變數名稱 | 必填 | 說明 |
|---------|------|------|
| `GEMINI_API_KEY` | ✅ | Gemini API Key |
| `RESEND_API_KEY` | ✅ | Resend API Key（回報功能必需） |
| `FEEDBACK_RECIPIENT_EMAIL` | 選填 | 回報信件收件人，預設 `mooshi21824@gmail.com` |
| `RATE_LIMIT_MAX` | 選填 | OCR/parse/analyze 共用 quota，每 IP 每小時上限，預設 30 |

```bash
# 啟動開發伺服器
npm run dev
```

開啟瀏覽器前往 http://localhost:3000

### 其他指令

```bash
npm run build      # 建置正式版本
npm start          # 啟動正式伺服器
npm run dev:prod   # 以 NODE_ENV=production 啟動 dev server（測試 rate limit / 回報寄信）
npm run lint       # ESLint 檢查
npx vitest         # 執行測試
```

## 使用流程

```
選擇模式（拍照 / 文字輸入）
        │
   ┌────┴────┐
   ▼         ▼
 上傳照片   輸入文字
   │         │
   ▼         │
 裁切圖片    │
   │         │
   ▼         │
 OCR 擷取   │
   │         │
   ▼         │
 確認文字 ◄──┘
   │
   ▼
 AI 解析 + 分類
   │
   ▼
 顯示結果（可切換素食類型）
   │
   ▼
（選填）勾選可疑成分 → 回報有誤 → 寄信通知維運
```

## 專案結構

```
src/
├── app/
│   ├── api/
│   │   ├── ocr/route.ts          # OCR API
│   │   ├── parse/route.ts        # 成分解析 API
│   │   ├── analyze/route.ts      # 完整分析 API
│   │   └── feedback/route.ts     # 使用者回報 API
│   ├── page.tsx                  # 主頁面（狀態機）
│   ├── layout.tsx                # Root layout
│   └── globals.css               # 設計系統 + 主題色
├── components/
│   ├── ImageUploader.tsx         # 圖片上傳
│   ├── ImageCropper.tsx          # 圖片裁切
│   ├── TextInput.tsx             # 文字輸入
│   ├── OcrReview.tsx             # OCR 結果確認
│   ├── ResultDisplay.tsx         # 結果頁面（含勾選 / 回報入口）
│   ├── IngredientGroup.tsx       # 成分分組列表（每列含 checkbox）
│   ├── FeedbackModal.tsx         # 回報有誤對話框
│   ├── VerdictBanner.tsx         # 判定結果橫幅
│   └── VegetarianTypeSwitcher.tsx # 素食類型切換
├── lib/
│   ├── gemini.ts                 # Gemini API client
│   ├── ocr.ts                    # OCR 文字擷取
│   ├── parser.ts                 # 成分解析
│   ├── classifier.ts             # 成分分類
│   ├── ingredient-matcher.ts     # 資料庫比對
│   ├── verdict.ts                # 判定邏輯
│   ├── rate-limit.ts             # 速率限制（多 bucket）
│   ├── feedback-email.ts         # Resend 寄信封裝
│   └── crop-image.ts             # 裁切工具
├── types/
│   └── ingredients.ts            # 型別定義
└── data/
    └── ingredients.json          # 成分資料庫
```

## 成分分類邏輯

每項成分會被歸類為以下類別之一：

| 類別 | 說明 | 範例 |
|------|------|------|
| `non-vegetarian` | 動物性成分 | 明膠、豬油、蚵油 |
| `five-pungent` | 五辛 | 大蒜、洋蔥、韭菜 |
| `egg` | 蛋類 | 蛋黃、蛋白、卵磷脂 |
| `dairy` | 奶類 | 牛奶、奶粉、乳清 |
| `ambiguous` | 無法確定 | AI 無法判定的成分 |
| `vegetarian` | 全素 | 糖、鹽、麵粉 |

各素食類型允許的成分：

| 素食類型 | 全素 | 蛋 | 奶 | 五辛 |
|---------|------|----|----|------|
| 全素 | ✅ | ❌ | ❌ | ❌ |
| 蛋素 | ✅ | ✅ | ❌ | ❌ |
| 奶素 | ✅ | ❌ | ✅ | ❌ |
| 蛋奶素 | ✅ | ✅ | ✅ | ❌ |
| 五辛素 | ✅ | ✅ | ✅ | ✅ |

## 速率限制

- `/api/ocr` `/api/parse` `/api/analyze` 共用 quota：30 次 / 小時 / IP（可由 `RATE_LIMIT_MAX` 覆寫）
- `/api/feedback` 獨立 quota：10 次 / 小時 / IP
- 開發環境 (`NODE_ENV !== production`) 自動繞過

## 回報功能

結果頁每筆成分旁的 checkbox 可勾選為「分類有誤」候選，按底部「回報有誤」按鈕開啟 modal，可再調整勾選、補上自由說明、選填建議的正確分類後送出。送出時會經由 [Resend](https://resend.com) 寄信至 `FEEDBACK_RECIPIENT_EMAIL`（預設 `mooshi21824@gmail.com`）。

- **不寫資料庫**：信箱即儲存，Phase 1 不引入持久化（KV / DB）
- **信件內容繁中**：時間、來源識別、素食類型、已勾選成分、完整成分清單、建議分類、補充說明，全段以繁體中文呈現
- **隱私**：使用者 IP 以 SHA-256 取前 8 字元作為匿名識別碼（`IP#xxxxxxxx`），不留完整 IP
- **濫用防護**：`/api/feedback` 採獨立 rate-limit bucket，10 次 / 小時 / IP，與 OCR/parse/analyze quota 互不干擾

## 開發方法論

本專案使用 [Spectra](https://github.com/spectra) 進行 Spec-Driven Development（SDD），規格文件與變更提案位於 `openspec/` 目錄。

## License

Private

# VeggieScan 🌿

素食成分掃描器 — 拍照或輸入食品成分，即時判斷是否符合你的素食類型。

## 功能特色

- **拍照辨識**：上傳食品包裝照片，透過 OCR 自動擷取成分文字
- **自由裁切**：上傳後可自由調整裁切範圍，精確框選成分標示區域
- **手動輸入**：也可直接貼上或輸入成分文字
- **智慧分類**：內建 100+ 筆常見成分資料庫，搭配 AI 辨識未知成分
- **五種素食類型**：全素、蛋素、奶素、蛋奶素、五辛素，即時切換即時判定
- **分類結果一目瞭然**：成分依動物性、五辛、蛋奶、無法確定、全素分組顯示
- **響應式設計**：手機、平板、桌面皆適用

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + CSS custom properties
- **AI**: Google Gemini 2.5 Flash（OCR、成分解析、分類）
- **Image Cropping**: react-cropper (Cropper.js)
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
```

> Gemini API Key 可至 [Google AI Studio](https://aistudio.google.com/apikey) 免費申請。

```bash
# 啟動開發伺服器
npm run dev
```

開啟瀏覽器前往 http://localhost:3000

### 其他指令

```bash
npm run build   # 建置正式版本
npm start       # 啟動正式伺服器
npm run lint    # ESLint 檢查
npx vitest      # 執行測試
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
```

## 專案結構

```
src/
├── app/
│   ├── api/
│   │   ├── ocr/route.ts          # OCR API
│   │   ├── parse/route.ts        # 成分解析 API
│   │   └── analyze/route.ts      # 完整分析 API
│   ├── page.tsx                  # 主頁面（狀態機）
│   ├── layout.tsx                # Root layout
│   └── globals.css               # 設計系統 + 主題色
├── components/
│   ├── ImageUploader.tsx         # 圖片上傳
│   ├── ImageCropper.tsx          # 圖片裁切
│   ├── TextInput.tsx             # 文字輸入
│   ├── OcrReview.tsx             # OCR 結果確認
│   ├── ResultDisplay.tsx         # 結果頁面
│   ├── IngredientGroup.tsx       # 成分分組列表
│   ├── VerdictBanner.tsx         # 判定結果橫幅
│   └── VegetarianTypeSwitcher.tsx # 素食類型切換
├── lib/
│   ├── gemini.ts                 # Gemini API client
│   ├── ocr.ts                    # OCR 文字擷取
│   ├── parser.ts                 # 成分解析
│   ├── classifier.ts             # 成分分類
│   ├── ingredient-matcher.ts     # 資料庫比對
│   ├── verdict.ts                # 判定邏輯
│   ├── rate-limiter.ts           # 速率限制
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

- 每個 IP：20 次 / 日
- 全站上限：500 次 / 日
- 每日 UTC 00:00 重置

## 開發方法論

本專案使用 [Spectra](https://github.com/spectra) 進行 Spec-Driven Development（SDD），規格文件與變更提案位於 `openspec/` 目錄。

## License

Private

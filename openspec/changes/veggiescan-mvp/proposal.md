## Why

素食者在國外購物時，面對不熟悉的語言和複雜的食品添加物代碼，難以判斷商品成分是否適合自己食用。目前沒有簡單的工具能讓使用者拍照或輸入成分後，快速得到基於台灣素食五大分類（全素、蛋素、奶素、蛋奶素、五辛素）的判定結果。

## What Changes

建立 VeggieScan Web App，提供以下功能：

- **食品成分輸入**：使用者可拍照上傳食品包裝圖片，或在文字框手動輸入成分
- **OCR 文字辨識**：透過 Gemini 2.5 Flash 從圖片提取成分文字（支援中文、英文、日文）
- **成分整理**：透過 AI 過濾非成分資訊，拆分複合成分，條列化每項成分
- **成分判定**：靜態 JSON 成分資料庫優先比對（含別名、學名、模糊標示），未知成分交由 AI 判定
- **結果呈現**：總結判定 + 分類明細（不可食用 → 五辛 → 蛋奶 → 無法確定 → 全素可食），支援素食類型即時切換
- **API 防護**：IP 限流 + 全站每日總額度上限，防止濫用

## Non-Goals

- Google 登入與帳號系統
- 查詢紀錄保存
- 中文、英文以外的成分判定（日文僅限 OCR 辨識，判定仍以中英文為主）
- 行動端原生 App

## Capabilities

### New Capabilities

- `ingredient-input`: 食品成分輸入，支援圖片上傳（OCR）與手動文字輸入
- `ocr-extraction`: 透過 Gemini 2.5 Flash 從食品包裝圖片提取成分文字
- `ingredient-parsing`: AI 整理輸入內容，過濾非成分資訊，拆分複合成分並條列化
- `ingredient-database`: 靜態 JSON 成分資料庫，包含常見非素食成分、五辛、蛋奶成分及其別名
- `vegetarian-classification`: 根據台灣素食五大分類判定每項成分的可食用層級
- `result-display`: 結果頁面呈現，含總結判定、分類明細、素食類型切換器
- `rate-limiting`: API 防護機制，IP 限流與全站每日總額度上限

### Modified Capabilities

(none — this is a new project)

## Impact

- Affected code: new project, all files are new
- Dependencies: `@google/generative-ai` (Gemini API), Node.js backend framework (TBD), frontend framework (TBD)
- External services: Google Gemini 2.5 Flash API

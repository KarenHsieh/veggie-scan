## 🥬 專案名稱

**VeggieScan｜素食掃描識別器**

---

## 💡 專案概念（Project Concept）

**「讓素食者與關心成分的人，在任何國家都能安心購物。」**

VeggieScan 是一個基於 **文字辨識（OCR）** 與 **成分比對邏輯** 的 Web 應用程式。
使用者只需拍照上傳食品包裝成分表，系統會自動解析文字並判斷該商品是否適合素食者食用。

專案靈感來自真實旅遊經驗：

> 在國外購物時，語言障礙與複雜添加物代碼讓素食者難以判斷是否能吃。

---

## 快速開始

### 安裝依賴

```bash
pnpm install
```

### 本地開發

```bash
pnpm dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 建置專案

```bash
pnpm build
pnpm start
```

### Health Check

訪問 [http://localhost:3000/api/health](http://localhost:3000/api/health) 檢查 API 狀態

---

## 專案結構

```
/app
  /scan/page.jsx              # 主掃描頁面
  /history/page.jsx           # 歷史記錄頁面
  /api/health/route.js        # Health Check API
  layout.jsx                  # 主要 Layout
  page.jsx                    # 首頁
/lib                          # 工具函式庫（待建立）
/data                         # 成分資料庫（待建立）
/doc                          # 開發文件
```

---

## MVP v1.0 開發進度

### Week 1: 基礎架構與文字工作流程

- [x] Day 1-2: 專案初始化
  - [x] Next.js + Tailwind CSS 設定
  - [x] 基本頁面結構（首頁、掃描頁、歷史頁）
  - [x] Health Check API
  - [x] Dockerfile 建立
- [x] Day 3-4: 資料庫與文字前處理
  - [x] e-codes.json (29 條 E 添加物)
  - [x] ingredients.base.json (51 條常見成分)
  - [x] normalize.js 文字清洗模組
  - [x] tokenize.js 分詞模組
  - [x] 單元測試 (normalize + tokenize)
- [x] Day 5-6: 判斷引擎與 API
  - [x] classify.js 判斷引擎（模糊比對 + 優先序規則）
  - [x] explain.js 解釋模組（生成判斷理由）
  - [x] /app/api/classify/route.js API 端點
  - [x] 整合到掃描頁面（結果顯示）
  - [x] 單元測試 (classify + explain)

### Week 2: OCR 整合與前端介面

- [x] Day 7-8: 前端 OCR 整合
  - [x] 安裝 tesseract.js
  - [x] /lib/ocr/tesseract.js OCR 模組
  - [x] UploadArea 圖片上傳元件
  - [x] 整合到掃描頁面（拖曳上傳、進度顯示）
  - [x] 圖片預覽與錯誤處理
  - [x] OCR 文字清理功能
- [x] Day 9-10: 結果顯示與歷史紀錄
  - [x] ResultCard 結果卡片元件
  - [x] localStorage 歷史記錄功能
  - [x] 歷史記錄頁面
  - [x] 再掃一次、複製文字功能
  - [x] 從歷史記錄重新分析
- [ ] Day 11-12: i18n + 體驗修飾
- [ ] Day 13-14: 測試、驗證與上線

---

## 技術棧

- **前端**: Next.js 16 (App Router) + React 19 + Tailwind CSS
- **OCR**: Tesseract.js（前端）
- **資料層**: JSON 檔案（MVP 階段）
- **部署**: Zeabur
- **測試**: Vitest + Playwright

---

## 開發文件

詳細開發文件請參考 `/doc` 目錄：

- [開發文件.md](./doc/開發文件.md) - 開發目的、原則與架構
- [MVP v1.0 交付清單.md](./doc/MVP%20v1.0%20交付清單.md) - 功能規格與驗收標準
- [MVP v1.0 開發順序.md](./doc/MVP%20v1.0%20開發順序.md) - 詳細開發步驟

---

## 授權

ISC

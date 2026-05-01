## Why

食品包裝上除了成分以外，常含有「過敏原提示」「保存方式」「賞味期限」「開封後注意事項」等對使用者極為重要的訊息。目前 `src/lib/parser.ts` 在 prompt 中明確要求 Gemini「丟掉」這些內容（filter out nutritional information, storage instructions, allergen warnings…），導致使用者完整看不到這些警示，過敏原警示甚至比素食判定更重要 — 誤食可能造成健康風險。

由於 Gemini 在 parse 階段已經看到這些資訊（只是被丟掉），把它們撿回來結構化後展示，邊際成本接近零。

## What Changes

- **Lib（修改 `ingredient-parsing`）**：擴展 `src/lib/parser.ts`，把 prompt 改為同時抽取 `ingredients` 與 `notices`，回傳 `{ ingredients: ParsedIngredient[]; notices: Notice[] }`。`notices` 欄位 missing 時當作空陣列（schema-tolerant，不影響成分分析）
- **Types**：在 `src/types/ingredients.ts` 新增 `NoticeType = 'allergen' | 'storage' | 'expiration' | 'other'` 與 `Notice = { type: NoticeType; text: string }`；`text` 為包裝原文（不翻譯不正規化）
- **API（新 capability `package-notices`）**：`/api/analyze` 回應加 `notices: Notice[]` 欄位（additive，不破壞既有契約）
- **UI（修改 `result-display`）**：新增 `<NoticeBanner>` 組件，置於 `ResultDisplay` 最頂端、verdict banner 之上；空陣列時整段隱藏；不受 `dietType` 影響；按四種 NoticeType 分組顯示，標籤分別為「過敏原」「保存方式」「賞味期限」「其他注意事項」

## Non-Goals

- **過敏原資料庫比對**：不做「使用者過敏體質設定 + 警告高亮」，僅原文呈現
- **翻譯 / 正規化**：notice text 保留原文（中 / 英 / 日），不像 ingredients 會做 normalizedName。理由是這些是陳述（含日期、警語），結構化會失真
- **獨立 endpoint**：不開 `/api/notices`，不單獨呼叫 Gemini 抽取（合併在 parser，省一次 API call）
- **編輯 / 修正 notice**：不提供使用者修改抽取結果的 UI（這次是純資訊展示）
- **OCR 步驟修改**：`/api/ocr` 已抽取所有文字含 notices，不變動
- **並行雙 call 方案**：考慮過 `Promise.all([parseIngredients, extractNotices])`，因節省一次 API call 與 prompt 維護成本而排除（容錯靠 schema-tolerant 解析）

## Capabilities

### New Capabilities

- `package-notices`：從食品包裝文字抽取結構化注意事項（過敏原 / 保存方式 / 賞味期限 / 其他），並透過 `/api/analyze` 回應與結果頁 banner 提供給使用者的端到端能力

### Modified Capabilities

- `ingredient-parsing`：原本的 prompt 明確「過濾掉」非成分內容；改為「保留並結構化」過敏原 / 保存方式 / 賞味期限 / 其他注意事項至 `notices` 陣列
- `result-display`：原本是 verdict + ingredient list；新增「包裝注意事項」區塊置於最頂端，獨立於 dietType

## Impact

- Affected specs: `package-notices`（新）, `ingredient-parsing`（修改）, `result-display`（修改）
- Affected code:
  - New:
    - src/components/NoticeBanner.tsx
    - src/lib/parser.test.ts
  - Modified:
    - src/lib/parser.ts
    - src/types/ingredients.ts
    - src/app/api/analyze/route.ts
    - src/components/ResultDisplay.tsx
    - src/app/page.tsx
- 無新增 npm 依賴
- 無資料庫 / migration 影響
- 無新增環境變數

## Context

`src/lib/parser.ts` 目前透過 Gemini 2.5 Flash 把 OCR / 使用者輸入文字解析成 `ParsedIngredient[]`，prompt 開頭明確要求模型「過濾掉」非成分內容（含過敏原、保存方式、營養標示、警語）。也就是 Gemini 看得到這些訊息但被 instruction 強制丟棄。

下游的 `/api/analyze`（`src/app/api/analyze/route.ts`）以 parse → classify → verdict 的順序執行，回傳 `{ ingredients, verdict }`；前端 `src/components/ResultDisplay.tsx` 以 `<VerdictBanner>` + `<IngredientGroup>` 呈現結果，所有 UI 元件都跟著 `dietType` 重新計算判定。

本次目標是把被丟掉的注意事項撿回來、結構化、並在結果頁優先展示，因為「誤食過敏原」的潛在風險高於「誤食非素食」，且這類資訊不應隨 dietType 切換而消失。

## Goals / Non-Goals

**Goals:**

- 從 OCR 或使用者貼入的標籤文字抽取四類注意事項：過敏原 / 保存方式 / 賞味期限 / 其他。
- 與既有 ingredient 抽取共用同一次 Gemini call，避免增加 API 次數與成本。
- 結果頁優先顯示，獨立於 dietType。
- notice 抽取失敗或欄位 missing 時，**不影響**成分分析主流程（schema-tolerant）。
- API 變更採加法，不破壞既有 `/api/analyze` 呼叫端。

**Non-Goals:**

- 不做使用者過敏體質設定 + 警告高亮。
- 不翻譯 / 不正規化 notice 文字（保留原文）。
- 不開獨立 `/api/notices` endpoint、不另起 Gemini call。
- 不修改 `/api/ocr`（OCR 已抽取所有文字）。
- 不提供使用者編輯抽取結果的 UI。

## Decisions

### 合併到 parser 單一 Gemini call，而非並行兩個 call

把 `parseIngredients(rawText)` 擴展為回傳 `{ ingredients, notices }`，prompt 改寫為同時要求兩種輸出。

**Rationale:**
- Gemini 已經在 parse 階段看到 notices（只是 prompt 命令丟掉），撿回來邊際成本接近零。
- 並行兩個 call 雖然有「容錯隔離」優勢，但 Gemini 2.5 Flash 回 JSON 失敗率本就低，且 notices 失敗只需 fallback 空陣列即可，不需要為此多一次 API。
- 省一次 API call、省一份 prompt 維護成本、省一次 rate-limit 計數。
- 模型若未來換成更便宜的版本（如 flash-lite），合併方案的省成本效應更明顯。

### Schema-tolerant 解析：notices 欄位 missing 時當空陣列

parser 對回應做寬鬆驗證 — 只要 ingredients 是合法陣列就認可，notices 欄位若 missing / 不是陣列 / 任一 element 結構錯誤，整個 notices 視為空陣列並以 `console.warn` 記錄，**不拋例外**。

**Rationale:**
- notices 是輔助資訊，不應因抽取問題拖垮主流程。
- 模型偶爾會省略 notices 欄位（特別是純成分輸入無注意事項時），硬性要求會頻繁誤報錯誤。
- 失敗 log 仍可追蹤模型行為異常。

### Notice 類別採封閉枚舉 + `other` catch-all

`NoticeType = 'allergen' | 'storage' | 'expiration' | 'other'`。模型若回傳未列出的 type 字串，parser 會把該 entry 歸入 `other`（保留 text，不丟掉）。

**Rationale:**
- 封閉枚舉讓 UI 可預測 — 每類有固定 icon / label / 排序。
- `other` catch-all 避免「不是這三類就丟掉」造成資訊漏失。
- 未來若需要新增類別（例如「食用建議」「警語」），可以從 other 觀察使用情形再決定是否升格。

### 保留原文，不翻譯不正規化

notice.text 直接是包裝印的原文（如 `賞味期限：2026.12.31`、`本產品含有牛奶、雞蛋及其製品`），不像 ingredient 會做 normalizedName。

**Rationale:**
- notices 是「陳述」不是「查表 key」，沒有比對需求。
- 日期格式、警語語氣若被 AI 改寫會失真且降低信任。
- 多語言混排（中日英）情境下，原文最不易出錯。

### UI 置頂、獨立 banner、空陣列時整段隱藏

`<NoticeBanner>` 放在 `ResultDisplay` 最上方、`<VerdictBanner>` 之上。視覺上以警示色（黃 / 橘）為主，與 verdict 區別。`notices.length === 0` 時整個元件 render null，不留空白。

**Rationale:**
- 過敏原警示優先級高於素食判定。
- 視覺上獨立 banner 比塞進 verdict 內更清楚。
- 隱藏空狀態避免噪音，多數產品會有部分注意事項但未必三類齊全。
- 不受 dietType 影響 — 切換素食類型時 NoticeBanner 內容不變，符合「對所有使用者都重要」的設計意圖。

### 加總呈現原則：每類最多顯示 N 條

UI 上每個 NoticeType 群組最多列出 5 筆，超過時截斷並提示「⋯ 還有 X 則」。截斷只發生在 UI 層，API 完整回傳。

**Rationale:**
- 防止包裝資訊量過大（如多語言警語）讓 UI 失控。
- API 不截斷讓未來「展開更多」功能保有彈性。
- 5 條覆蓋絕大多數實際包裝樣本。

## Risks / Trade-offs

- **[模型把 ingredient 誤分類為 notice 或反之]** → Mitigation：prompt 明確列出兩者邊界與範例（例如「砂糖」是 ingredient、「請冷藏保存」是 notice）；parser 對輸出長度做 sanity check，發現嚴重失衡時 log warning。實際採用後可從回報資料持續調整 prompt。
- **[notices 增加 Gemini token 消耗，可能影響 OCR 之後的 prompt 長度限制]** → Mitigation：parser prompt 限制 notice text 長度上限（例如每筆 ≤ 200 字、總共 ≤ 20 筆），超過視為解析失敗 fallback 空陣列。OCR 文字本身已是輸入端的瓶頸，notices 抽取不顯著加重。
- **[兩端類型不一致風險]** → Mitigation：`Notice` 與 `NoticeType` 定義在 `src/types/ingredients.ts`，前後端共用 import，避免重複宣告。
- **[使用者誤把 notices 當成法定保證]** → Mitigation：UI 文案加上「以包裝實際標示為準」一行小字。實際法律責任由產品標示承擔，本服務僅做資訊整理。
- **[NoticeType 枚舉以後難擴充]** → Mitigation：parser 對未知 type 統一歸入 `other`，UI 對 `other` 也有展示路徑；未來新增類別只需加 enum 值與 UI 樣式，不需改 schema。

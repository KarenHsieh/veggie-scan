## 1. 型別與 parser 改寫

- [x] 1.1 在 `src/types/ingredients.ts` 新增 `NoticeType` 枚舉與 `Notice` interface（對應 design 決策「Notice 類別採封閉枚舉 + `other` catch-all」）
- [x] 1.2 重寫 `src/lib/parser.ts` 的 prompt 與函式回傳值，使單次 Gemini call 同時抽取 `{ ingredients, notices }`，notice text 保留包裝原文不翻譯（對應 design 決策「合併到 parser 單一 Gemini call，而非並行兩個 call」、「保留原文，不翻譯不正規化」、spec 需求「Package notice extraction」、`ingredient-parsing` 修改後需求「Filter non-ingredient information」）

## 2. 容錯與單元測試

- [x] 2.1 在 parser 內實作 schema-tolerant 解析：`notices` 欄位 missing 或非陣列時 fallback 空陣列並 `console.warn`，不拋例外（對應 design 決策「Schema-tolerant 解析：notices 欄位 missing 時當空陣列」、spec 需求「Schema-tolerant notice extraction」）
- [x] 2.2 對單筆 notice entry 缺 `text` / `type` 欄位則丟棄；`type` 為枚舉外字串則保留 text 並降為 `other`
- [x] 2.3 撰寫 `src/lib/parser.test.ts`（若不存在則新建）：mock Gemini response，覆蓋成功抽取四類（allergen/storage/expiration/other）、ingredients-only 輸入、`notices` 欄位 missing、單筆 entry malformed、unknown type 降為 other 共 5+ 個測試

## 3. API 整合

- [x] 3.1 修改 `src/app/api/analyze/route.ts`，把 parser 回傳的 `notices` 透傳到 200 response body 中（對應 spec 需求「Analyze API exposes notices field」）
- [x] 3.2 確保 `notices` 在無抽取結果時仍以空陣列回傳（不為 `null`、不省略 key），維持加法 contract 不破壞既有呼叫端
- [x] 3.3 既有 `parsed = await parseIngredients(...)` 呼叫端改為解構 `{ ingredients, notices }`，`ingredients` 餵給 `classifyIngredients`，`notices` 直接透傳至回應

## 4. UI 元件與串接

- [x] 4.1 建立 `src/components/NoticeBanner.tsx`，輸入 `notices: Notice[]`，按 NoticeType 分組顯示；空陣列時 `return null`（對應 design 決策「UI 置頂、獨立 banner、空陣列時整段隱藏」、spec 需求「Notice display banner」、`result-display` 新需求「Package notice section above verdict」）
- [x] 4.2 在 `NoticeBanner` 實作固定群組排序 `allergen → storage → expiration → other`，每組最多顯示 5 筆，超過時顯示「⋯ 還有 N 則」指示器（對應 design 決策「加總呈現原則：每類最多顯示 N 條」、spec 需求「Per-group display cap」）
- [x] 4.3 修改 `src/components/ResultDisplay.tsx`：新增 `notices` prop，將 `<NoticeBanner>` 置於 `<VerdictBanner>` 之上；NoticeBanner 不依賴 `dietType`
- [x] 4.4 修改 `src/app/page.tsx`：從 `/api/analyze` 回應取出 `notices` 加入 state（並在 `handleClear` 中重置），傳給 `ResultDisplay`

## 5. 驗收

- [x] 5.1 跑 `npx tsc --noEmit`、`npm run lint`、`npx vitest` 三項全部通過（既有 76 測試 + 新增 parser 測試）
- [x] 5.2 啟動 `npm run dev:prod`，貼入含「過敏原」「保存方式」「賞味期限」「開封後注意」的範例文字，確認：banner 顯示在 verdict 之上、切換 dietType 時 banner 內容不變、輸入無 notices 的純成分文字時 banner 不渲染、單一群組超過 5 筆時顯示「⋯ 還有 N 則」

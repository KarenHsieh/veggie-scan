## Why

veggie-scan 的三個 API route（`/api/ocr`、`/api/parse`、`/api/analyze`）背後串接付費的 AI / OCR 服務，目前沒有任何流量保護機制，單一使用者或爬蟲都能無限次呼叫，存在費用暴衝風險。產品即將公開上線以累積 SEO / GA 數據，必須在上線前加上最基本的防濫用機制，同時保留匿名使用者無摩擦體驗（不做登入牆）。

## What Changes

- 新增 IP-based rate limit：每個 IP 每小時最多呼叫受保護端點 30 次，超過回傳 HTTP 429
- 受保護端點範圍：`/api/ocr`、`/api/parse`、`/api/analyze`
- 本機開發環境（`NODE_ENV !== 'production'`）完全 bypass，不受限制
- Phase 1 採用**純記憶體 Map** 儲存計數（零依賴、零新服務），搭配定時清理過期 entry
- 回傳 429 時在 response body 帶上 `retryAfter`（秒數）以便前端顯示
- 在 `design.md` 中明確記錄三階段路線圖與進入下一階段的觸發條件（Phase 2: Redis、Phase 3: 登入分層額度），作為未來決策依據

## Non-Goals

- **不做**使用者登入系統（等 GA 有回訪訊號再評估）
- **不導入** Redis 或任何外部儲存（等多 instance 或重啟掉資料成為實際問題再評估）
- **不做**分層額度（匿名 vs 登入）
- **不做**細粒度的 per-endpoint 額度區分（三個端點共用同一個計數桶就好）
- **不做** GA event 埋點（會在獨立的 analytics change 處理；本 change 僅回傳明確的 429 讓前端有能力上報）

## Capabilities

### New Capabilities

- `rate-limiting`: 對公開 API 端點套用 IP-based 流量限制，保護後端付費服務免於濫用，同時允許本機開發不受限。

### Modified Capabilities

(none)

## Impact

- Affected specs: 新增 `specs/rate-limiting/spec.md`
- Affected code:
  - 新增 `src/lib/rate-limit.ts`（in-memory rate limit helper）
  - 修改 `src/app/api/ocr/route.ts`
  - 修改 `src/app/api/parse/route.ts`
  - 修改 `src/app/api/analyze/route.ts`
- Affected dependencies: 無新增套件
- Affected infra: 部署平台從 Zeabur 改為 Vercel（serverless functions）；本 change 已 ship 的 in-memory 實作在 Vercel 上降級為 best-effort 防爆量（Phase 1 仍適用，Phase 2 觸發條件變嚴）

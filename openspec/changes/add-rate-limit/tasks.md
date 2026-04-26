## 1. Rate limit helper module

- [x] 1.1 Create `src/lib/rate-limit.ts` skeleton exporting a single `checkRateLimit(request: Request)` function returning `{ ok: true } | { ok: false, retryAfter: number }`
- [x] 1.2 Implement Client IP resolution: read `x-forwarded-for` (first comma-split entry), fall back to `x-real-ip`, fall back to literal `"unknown"` — per the design decision "以 IP 作為識別單位"
- [x] 1.3 Implement Development environment bypass: when `process.env.NODE_ENV !== 'production'`, return `{ ok: true }` immediately without touching counter state — per the design decision "Dev 環境完全 bypass"
- [x] 1.4 Implement In-memory counter storage with lazy cleanup using `Map<string, { count: number; resetAt: number }>` at module scope — per the design decision "使用純記憶體 Map 作為 Phase 1 儲存後端" and "清理過期 entry 的策略"
- [x] 1.5 Implement the IP-based request quota on protected endpoints using a fixed window (30 requests / 3600000 ms) — per the design decisions "額度設為 30 次 / 每小時" and "視窗採 fixed window（非 sliding window）"
- [x] 1.6 On lazy cleanup: delete the accessed key when its `resetAt` has passed; when the `Map` size > 1000 during a write, iterate once and delete all expired entries
- [x] 1.7 Export a helper `buildRateLimitResponse(retryAfter: number): Response` that produces the "429 回應格式": JSON body `{ error: "rate_limited", message, retryAfter }` plus `Retry-After` header

## 2. Apply to protected API routes

- [x] 2.1 In `src/app/api/ocr/route.ts`, call `checkRateLimit` at the top of the handler and return the 429 response when `ok === false`
- [x] 2.2 In `src/app/api/parse/route.ts`, call `checkRateLimit` at the top of the handler and return the 429 response when `ok === false`
- [x] 2.3 In `src/app/api/analyze/route.ts`, call `checkRateLimit` at the top of the handler and return the 429 response when `ok === false`
- [x] 2.4 Verify the three endpoints share a single quota bucket per IP by confirming they all import the same module-level `Map` (no per-route instances)

## 3. Tests

- [x] 3.1 Add vitest unit tests in `src/lib/rate-limit.test.ts` covering: first request under quota, 30th request under quota, 31st request rejected, window reset after expiry, dev bypass short-circuits, IP resolution priority (x-forwarded-for / x-real-ip / unknown)
- [x] 3.2 Add a test that simulates > 1000 unique IPs to verify the bulk cleanup path deletes expired entries
- [x] 3.3 Add a test verifying the 429 response format (JSON body fields + `Retry-After` header match `retryAfter`)

## 4. Manual verification on Zeabur

- [ ] 4.1 Deploy to Zeabur and confirm `x-forwarded-for` header is populated by the proxy (curl with and without header; log resolved IP temporarily if needed)
- [ ] 4.2 Smoke test: hit `/api/analyze` 31 times in a row and confirm the 31st returns 429 with correct body and `Retry-After`
- [ ] 4.3 Confirm local `npm run dev` remains unrestricted

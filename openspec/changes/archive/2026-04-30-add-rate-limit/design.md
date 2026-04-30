## Context

veggie-scan 是一個 Next.js 應用，部署在 Vercel 上（serverless functions，每次冷啟動為新 instance，跨 instance 不共享記憶體）。三個受保護的 API route 都會觸發後端付費服務：

```
POST /api/ocr      → 影像文字辨識
POST /api/parse    → 結構化解析
POST /api/analyze  → AI 分析（最貴）
```

產品即將公開上線，目標是：
1. 讓匿名訪客無摩擦使用（以利 SEO / GA 數據累積）
2. 防止意外或惡意的費用暴衝
3. 保留可觀察性，之後根據真實數據決定要不要加強

**這份 design 的特殊之處**：除了描述 Phase 1 的實作，還記錄了**三階段路線圖**與**進入下一階段的客觀觸發條件**，作為未來檢查 GA 時的 checklist，避免憑感覺決策。

## Goals / Non-Goals

**Goals:**

- 最小成本（~40 行 code、零新依賴、零新服務）擋住流量暴衝
- 本機開發完全透明，不影響 DX
- 429 回應資訊足夠讓前端顯示友善訊息（包含可重試時間）
- 將「何時升級」的判斷條件寫死在 repo 裡，未來不用重新討論

**Non-Goals:**

- 不追求分散式一致性（單 instance 夠用）
- 不追求重啟保持計數（重啟歸零可接受）
- 不做 per-user 身份識別（Phase 1 只用 IP）
- 不做 per-endpoint 獨立額度（共用一個桶）
- 不埋 GA event（獨立 change 處理；但回傳 429 要夠明確讓前端能 hook）

## Decisions

### 使用純記憶體 Map 作為 Phase 1 儲存後端

以 `Map<ip, { count: number, resetAt: number }>` 作為計數儲存。

**為什麼現在不用 Vercel KV**：Vercel KV 需要在 dashboard 開通、注入額外環境變數、新增 `@vercel/kv` 依賴、多一個外部呼叫的失敗點。對 MVP 階段的應用代價超過收益。換 backend 的成本很低（helper 介面固定，內部換實作大概 10 分鐘）。

**為什麼不用檔案 / SQLite**：每次請求讀寫 disk 慢且醜，SQLite 還要考慮 schema migration；況且 Vercel serverless function 沒有持久化檔案系統。

**Vercel serverless 上的行為（重要 caveat）**：每個 cold start = 新 instance，計數不共享；同一個 IP 可能落在多個 warm instance 之間。實際限額可能比 30/hr 寬鬆 2~5x，但對「防止費用暴衝」場景仍然有效——同 instance 內的連續請求會被擋，單一 IP 持續 hammer 在下一次冷啟動後仍會被擋。完全失效需要每個 request 都剛好命中新的 cold start，實務上不會發生。

接受這個降級的理由：Phase 1 的目標就是「防爆量」而非「精準限額」，degraded 仍能擋住明顯異常。觸發 Phase 2（Vercel KV）的條件因此變嚴——見下方路線圖。

**取捨**：
- ✅ 零依賴、零設定
- ❌ 跨 instance 不共享計數（Vercel serverless 本質；接受為 best-effort）
- ❌ 重啟歸零（可接受，反正不是為了擋惡意攻擊）

### 以 IP 作為識別單位

從 request header 抓 `x-forwarded-for`（Vercel proxy 會設；header 可能含多個 IP 構成 proxy chain，取第一個 entry 即為 client IP），fallback 到 `x-real-ip`，再 fallback 到 `unknown`（同桶共用）。

**為什麼不用 cookie / session**：cookie 清掉就繞過，對本場景（防爆量而非防攻擊）沒有額外價值，還要處理 Set-Cookie 的邊界情況。

### 額度設為 30 次 / 每小時

比原本討論的「一小時十次」寬鬆，理由：

1. 上線初期沒有真實使用數據，設緊的話會把正常使用者當成濫用者擋掉，**連 GA 數據都收不到**
2. 三個端點共用一個桶，單次「掃描流程」可能就會打 3 支 API，十次流程 = 30 次呼叫
3. 寧可先寬鬆、觀察 GA、再收緊，比反過來好

### 視窗採 fixed window（非 sliding window）

每個 IP 記一個 `resetAt` timestamp，超過就重置整個計數。

**為什麼不用 sliding window**：sliding window 實作複雜（要存時間戳陣列），fixed window 對防爆量等級的需求已經夠用。唯一缺點是邊界可能允許短暫 2x 突刺，對本場景無害。

### Dev 環境完全 bypass

`process.env.NODE_ENV !== 'production'` 時 helper 直接 return `{ ok: true }`，不計數、不擋。

**為什麼不是「dev 額度放寬」**：開發時做功能測試、寫 e2e、跑 vitest 都可能瘋狂呼叫 API，任何上限都會變成絆腳石。完全 bypass 最乾淨。

### 429 回應格式

```json
{
  "error": "rate_limited",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 1823
}
```

同時設定 `Retry-After` header（秒數）符合 HTTP 規範。前端未來可以依此顯示倒數或友善提示，也可以自己埋 GA event。

### 清理過期 entry 的策略

採 **lazy cleanup**：每次讀取時檢查 `resetAt`，過期就刪除；另外在每次寫入時，若 Map size 超過 1000，掃一遍刪掉所有過期 entry。

**為什麼不用 setInterval**：setInterval 會阻止 Node process 乾淨結束、在測試環境需要 cleanup、在 serverless 環境不 reliable。lazy cleanup 完全避開這些問題。

## 三階段路線圖與升級觸發條件

這是本 change 的核心文件價值 —— 把「何時該升級」的判斷寫成 checklist，未來檢查 GA 時逐條確認，不靠記憶、不靠感覺。

#### Phase 1 — 本次 change ✅

- In-memory Map, IP-based, 30 req/hr, dev bypass
- 套用於 `/api/ocr`、`/api/parse`、`/api/analyze`
- 回傳 429 + `retryAfter`

#### Phase 2 — 改用 Vercel KV

**進入條件（任一成立即評估升級）：**

- [ ] GA 或伺服器 log 顯示 ≥5% session 撞到 429
- [ ] 觀察到單 IP 規律性繞過上限（實際呼叫量明顯超過設計值，且 cold-start 分布顯示為跨 instance 計數失效）
- [ ] 單一 warm instance 觀察到的 unique IP > 10,000（代表流量規模已進入另一個量級，跨 instance 失準的影響也跟著放大）
- [ ] 單次 deploy 間隔內，計數歸零造成實際誤判或使用者投訴

> 註：原本「需要開 ≥2 instance」這條觸發條件已不適用——Vercel 本來就 multi-instance auto-scale，此條件預設成立；但因 Phase 1 已接受 best-effort 降級，不再以此單獨觸發升級。

**動作：**
1. 在 Vercel dashboard 開通 Vercel KV（Storage tab → Create → KV）
2. Vercel 自動注入 `KV_REST_API_URL` / `KV_REST_API_TOKEN` 環境變數
3. `npm install @vercel/kv`
4. 把 `src/lib/rate-limit.ts` 的內部實作從 Map 換成 `kv.incr` + `kv.expire`
5. 介面不變，三個 route 不需要改動

#### Phase 3 — 登入系統 + 分層額度

**進入條件（任一成立即評估升級）：**

- [ ] GA 顯示有明顯回訪使用者（例如 returning users > 20% 且週增長穩定）
- [ ] 使用者主動反映「額度不夠」（表單、email、issue 累積 ≥5 則）
- [ ] 有付費方案的商業需求
- [ ] Phase 2 升級後仍持續有 >10% session 撞到上限

**動作：**
1. 開獨立的 `add-authentication` change 處理登入系統本體
2. 開獨立的 `add-tiered-rate-limit` change 處理分層額度
3. Rate limit key 從 IP 改為 `user_id || ip`
4. 額度設計依據當時的 GA 數據決定，不在此處預設數字

#### 當前階段狀態

```
Phase 1: ✅ 完成（in-memory；Vercel 上 best-effort）
Phase 2: ⏸  待觸發（目標：Vercel KV）
Phase 3: ⏸  待觸發
```

未來任何人（或未來的 Claude）檢視此文件時，請先對照上面的觸發條件 checklist 確認是否應進入下一階段。**不要憑感覺升級**。

## Risks / Trade-offs

- **[Risk] 單 instance 重啟會清空計數** → Mitigation: 可接受，反正不是防攻擊等級；若頻繁 deploy 造成問題則提早觸發 Phase 2
- **[Risk] 位於 NAT / 公司網路後的多個使用者共用同一 IP 會互相影響** → Mitigation: 額度設寬（30/hr）降低誤傷機率；未來 Phase 3 做登入後即解決
- **[Risk] 記憶體 Map 若無清理會緩慢成長** → Mitigation: lazy cleanup + size > 1000 時主動掃描
- **[Risk] Vercel proxy 若未正確設置 `x-forwarded-for`，所有請求會共用 `unknown` 桶** → Mitigation: 部署後用 curl 實測驗證；若 header 為 proxy chain 格式（多個 IP 以逗號分隔），確認取第一個 entry 即為 client IP
- **[Risk] Vercel cold start 導致同一 IP 計數在多 instance 間獨立累計，可能突破設計上限** → Mitigation: Phase 1 設計已接受此降級為 best-effort 防爆量；觀察到實際突破比例異常時觸發 Phase 2（Vercel KV）
- **[Risk] 本機跑 `next build && next start` 時 `NODE_ENV === 'production'` 會啟用限制** → Mitigation: 這是故意的，讓本機也能驗證 production 行為；若造成困擾可改用自訂 env var（例如 `RATE_LIMIT_DISABLED=1`）
- **[Trade-off] Fixed window 允許邊界 2x 突刺** → 接受，本場景不敏感

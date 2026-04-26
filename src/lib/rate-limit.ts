/**
 * Phase 1 rate limit: in-memory, IP-based, 30 requests per 1-hour fixed window.
 * Shared across /api/ocr, /api/parse, /api/analyze via the module-level store.
 *
 * Upgrade triggers and roadmap live in openspec/changes/add-rate-limit/design.md.
 */

const WINDOW_MS = 60 * 60 * 1000
const DEFAULT_MAX_REQUESTS = 30
const CLEANUP_THRESHOLD = 1000

function getMaxRequests(): number {
  const raw = process.env.RATE_LIMIT_MAX
  if (!raw) return DEFAULT_MAX_REQUESTS
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_REQUESTS
}
const RATE_LIMIT_MESSAGE = '請求次數過多，請稍後再試。'

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number }

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

export function resolveClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real
  return 'unknown'
}

export function checkRateLimit(request: Request): RateLimitResult {
  // Development bypass — completely skip counter state.
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true }
  }

  const ip = resolveClientIp(request)
  const now = Date.now()
  const existing = store.get(ip)

  // Lazy cleanup: expired entry is replaced with a fresh window.
  if (!existing || existing.resetAt <= now) {
    if (store.size >= CLEANUP_THRESHOLD) {
      cleanupExpired(now)
    }
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }

  if (existing.count >= getMaxRequests()) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count++
  return { ok: true }
}

export function buildRateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: 'rate_limited',
      message: RATE_LIMIT_MESSAGE,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  )
}

function cleanupExpired(now: number): void {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}

// --- Test-only helpers ---
export function __resetRateLimitStore(): void {
  store.clear()
}

export function __getRateLimitStoreSize(): number {
  return store.size
}

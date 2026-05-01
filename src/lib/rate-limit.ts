/**
 * Phase 1 rate limit: in-memory, IP-based, fixed 1-hour window.
 *
 * Buckets are independent stores keyed by `(bucket, ip)`. The default bucket
 * (used when no `bucket` option is provided) is shared by /api/ocr, /api/parse,
 * and /api/analyze at 30 req/hr/IP. The `feedback` bucket is used by
 * /api/feedback at 10 req/hr/IP.
 *
 * Upgrade triggers and roadmap live in openspec/changes/add-rate-limit/design.md.
 */

const WINDOW_MS = 60 * 60 * 1000
const DEFAULT_MAX_REQUESTS = 30
const CLEANUP_THRESHOLD = 1000

export const DEFAULT_BUCKET = 'shared'
export const FEEDBACK_BUCKET = 'feedback'
export const FEEDBACK_MAX_REQUESTS = 10

function getDefaultMaxRequests(): number {
  const raw = process.env.RATE_LIMIT_MAX
  if (!raw) return DEFAULT_MAX_REQUESTS
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_REQUESTS
}
const RATE_LIMIT_MESSAGE = '請求次數過多，請稍後再試。'

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number }

export interface RateLimitOptions {
  bucket?: string
  maxRequests?: number
}

interface Entry {
  count: number
  resetAt: number
}

const buckets = new Map<string, Map<string, Entry>>()

function getBucket(name: string): Map<string, Entry> {
  let bucket = buckets.get(name)
  if (!bucket) {
    bucket = new Map()
    buckets.set(name, bucket)
  }
  return bucket
}

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

export function checkRateLimit(
  request: Request,
  options: RateLimitOptions = {}
): RateLimitResult {
  // Development bypass — completely skip counter state.
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true }
  }

  const bucketName = options.bucket ?? DEFAULT_BUCKET
  const max = options.maxRequests ?? getDefaultMaxRequests()
  if (!Number.isFinite(max) || max <= 0) {
    // Defensive: a misconfigured maxRequests fails closed.
    return { ok: false, retryAfter: WINDOW_MS / 1000 }
  }

  const ip = resolveClientIp(request)
  const now = Date.now()
  const bucket = getBucket(bucketName)
  const existing = bucket.get(ip)

  // Lazy cleanup: expired entry is replaced with a fresh window.
  if (!existing || existing.resetAt <= now) {
    if (bucket.size >= CLEANUP_THRESHOLD) {
      cleanupExpired(bucket, now)
    }
    bucket.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }

  if (existing.count >= max) {
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

function cleanupExpired(bucket: Map<string, Entry>, now: number): void {
  for (const [key, entry] of bucket) {
    if (entry.resetAt <= now) bucket.delete(key)
  }
}

// --- Test-only helpers ---
export function __resetRateLimitStore(): void {
  buckets.clear()
}

export function __getRateLimitStoreSize(bucketName: string = DEFAULT_BUCKET): number {
  return buckets.get(bucketName)?.size ?? 0
}

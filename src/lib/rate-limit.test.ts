import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  checkRateLimit,
  buildRateLimitResponse,
  resolveClientIp,
  FEEDBACK_BUCKET,
  FEEDBACK_MAX_REQUESTS,
  __resetRateLimitStore,
  __getRateLimitStoreSize,
} from './rate-limit'

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/test', { headers })
}

describe('rate-limit', () => {
  beforeEach(() => {
    __resetRateLimitStore()
    vi.stubEnv('NODE_ENV', 'production')
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  describe('resolveClientIp', () => {
    it('uses first entry of x-forwarded-for', () => {
      expect(
        resolveClientIp(makeRequest({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }))
      ).toBe('203.0.113.5')
    })

    it('trims whitespace around x-forwarded-for entries', () => {
      expect(
        resolveClientIp(makeRequest({ 'x-forwarded-for': '  203.0.113.5  ,  10.0.0.1  ' }))
      ).toBe('203.0.113.5')
    })

    it('falls back to x-real-ip when x-forwarded-for is absent', () => {
      expect(resolveClientIp(makeRequest({ 'x-real-ip': '203.0.113.7' }))).toBe('203.0.113.7')
    })

    it('returns "unknown" when no IP headers are present', () => {
      expect(resolveClientIp(makeRequest())).toBe('unknown')
    })
  })

  describe('IP-based request quota', () => {
    it('allows the first 30 requests within the window', () => {
      const req = makeRequest({ 'x-forwarded-for': '1.1.1.1' })
      for (let i = 0; i < 30; i++) {
        expect(checkRateLimit(req).ok).toBe(true)
      }
    })

    it('rejects the 31st request with retryAfter', () => {
      const req = makeRequest({ 'x-forwarded-for': '1.1.1.1' })
      for (let i = 0; i < 30; i++) checkRateLimit(req)
      const result = checkRateLimit(req)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.retryAfter).toBeGreaterThan(0)
        expect(result.retryAfter).toBeLessThanOrEqual(3600)
      }
    })

    it('tracks IPs independently', () => {
      const a = makeRequest({ 'x-forwarded-for': '1.1.1.1' })
      const b = makeRequest({ 'x-forwarded-for': '2.2.2.2' })
      for (let i = 0; i < 30; i++) checkRateLimit(a)
      expect(checkRateLimit(a).ok).toBe(false)
      expect(checkRateLimit(b).ok).toBe(true)
    })

    it('resets the counter after the 1-hour window expires', () => {
      const req = makeRequest({ 'x-forwarded-for': '1.1.1.1' })
      for (let i = 0; i < 30; i++) checkRateLimit(req)
      expect(checkRateLimit(req).ok).toBe(false)

      vi.advanceTimersByTime(60 * 60 * 1000 + 1)

      expect(checkRateLimit(req).ok).toBe(true)
    })
  })

  describe('development bypass', () => {
    it('allows unlimited requests when NODE_ENV !== production', () => {
      vi.stubEnv('NODE_ENV', 'development')
      const req = makeRequest({ 'x-forwarded-for': '1.1.1.1' })
      for (let i = 0; i < 200; i++) {
        expect(checkRateLimit(req).ok).toBe(true)
      }
    })

    it('does not touch counter state during bypass', () => {
      vi.stubEnv('NODE_ENV', 'development')
      checkRateLimit(makeRequest({ 'x-forwarded-for': '1.1.1.1' }))
      expect(__getRateLimitStoreSize()).toBe(0)
    })
  })

  describe('lazy cleanup', () => {
    it('removes expired entries when Map size exceeds 1000 on write', () => {
      // Populate 1001 unique IPs at time T
      for (let i = 0; i < 1001; i++) {
        const ip = `10.${Math.floor(i / 65536)}.${Math.floor(i / 256) % 256}.${i % 256}`
        checkRateLimit(makeRequest({ 'x-forwarded-for': ip }))
      }
      expect(__getRateLimitStoreSize()).toBe(1001)

      // Advance past window — all 1001 existing entries are now expired
      vi.advanceTimersByTime(60 * 60 * 1000 + 1)

      // A new write should trigger bulk cleanup (size > 1000)
      checkRateLimit(makeRequest({ 'x-forwarded-for': '99.99.99.99' }))

      // After cleanup, only the new entry should remain
      expect(__getRateLimitStoreSize()).toBe(1)
    })

    it('removes a single expired entry on access', () => {
      const req = makeRequest({ 'x-forwarded-for': '1.1.1.1' })
      checkRateLimit(req)
      expect(__getRateLimitStoreSize()).toBe(1)

      vi.advanceTimersByTime(60 * 60 * 1000 + 1)

      // Next call for the same IP should treat it as a fresh window
      const result = checkRateLimit(req)
      expect(result.ok).toBe(true)
      expect(__getRateLimitStoreSize()).toBe(1) // still 1 (replaced, not duplicated)
    })
  })

  describe('feedback bucket', () => {
    const feedbackOpts = { bucket: FEEDBACK_BUCKET, maxRequests: FEEDBACK_MAX_REQUESTS }

    it('allows the first 10 feedback requests within the window', () => {
      const req = makeRequest({ 'x-forwarded-for': '3.3.3.3' })
      for (let i = 0; i < FEEDBACK_MAX_REQUESTS; i++) {
        expect(checkRateLimit(req, feedbackOpts).ok).toBe(true)
      }
    })

    it('rejects the 11th feedback request with retryAfter', () => {
      const req = makeRequest({ 'x-forwarded-for': '3.3.3.3' })
      for (let i = 0; i < FEEDBACK_MAX_REQUESTS; i++) checkRateLimit(req, feedbackOpts)
      const result = checkRateLimit(req, feedbackOpts)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.retryAfter).toBeGreaterThan(0)
        expect(result.retryAfter).toBeLessThanOrEqual(3600)
      }
    })

    it('does not consume the default (analyze) bucket', () => {
      const req = makeRequest({ 'x-forwarded-for': '3.3.3.3' })
      // Exhaust feedback bucket
      for (let i = 0; i < FEEDBACK_MAX_REQUESTS; i++) checkRateLimit(req, feedbackOpts)
      expect(checkRateLimit(req, feedbackOpts).ok).toBe(false)
      // Default bucket still has full quota
      expect(checkRateLimit(req).ok).toBe(true)
    })

    it('is not consumed by the default (analyze) bucket', () => {
      const req = makeRequest({ 'x-forwarded-for': '3.3.3.3' })
      // Exhaust default bucket
      for (let i = 0; i < 30; i++) checkRateLimit(req)
      expect(checkRateLimit(req).ok).toBe(false)
      // Feedback bucket still has full quota
      expect(checkRateLimit(req, feedbackOpts).ok).toBe(true)
    })

    it('resets the feedback counter after the 1-hour window expires', () => {
      const req = makeRequest({ 'x-forwarded-for': '3.3.3.3' })
      for (let i = 0; i < FEEDBACK_MAX_REQUESTS; i++) checkRateLimit(req, feedbackOpts)
      expect(checkRateLimit(req, feedbackOpts).ok).toBe(false)

      vi.advanceTimersByTime(60 * 60 * 1000 + 1)

      expect(checkRateLimit(req, feedbackOpts).ok).toBe(true)
    })

    it('respects development bypass', () => {
      vi.stubEnv('NODE_ENV', 'development')
      const req = makeRequest({ 'x-forwarded-for': '3.3.3.3' })
      for (let i = 0; i < 100; i++) {
        expect(checkRateLimit(req, feedbackOpts).ok).toBe(true)
      }
      expect(__getRateLimitStoreSize(FEEDBACK_BUCKET)).toBe(0)
    })

    it('tracks IPs independently within feedback bucket', () => {
      const a = makeRequest({ 'x-forwarded-for': '3.3.3.3' })
      const b = makeRequest({ 'x-forwarded-for': '4.4.4.4' })
      for (let i = 0; i < FEEDBACK_MAX_REQUESTS; i++) checkRateLimit(a, feedbackOpts)
      expect(checkRateLimit(a, feedbackOpts).ok).toBe(false)
      expect(checkRateLimit(b, feedbackOpts).ok).toBe(true)
    })
  })

  describe('429 response format', () => {
    it('returns status 429 with JSON body and Retry-After header', async () => {
      const res = buildRateLimitResponse(1823)
      expect(res.status).toBe(429)
      expect(res.headers.get('Retry-After')).toBe('1823')
      expect(res.headers.get('Content-Type')).toContain('application/json')

      const body = await res.json()
      expect(body.error).toBe('rate_limited')
      expect(typeof body.message).toBe('string')
      expect(body.message.length).toBeGreaterThan(0)
      expect(body.retryAfter).toBe(1823)
    })
  })
})

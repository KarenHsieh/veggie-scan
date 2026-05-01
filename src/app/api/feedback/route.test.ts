import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ClassifiedIngredient } from '@/types/ingredients'

const sendMock = vi.fn()
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

import { POST } from './route'
import {
  __resetRateLimitStore,
  FEEDBACK_BUCKET,
  FEEDBACK_MAX_REQUESTS,
} from '@/lib/rate-limit'

const validIngredients: ClassifiedIngredient[] = [
  {
    originalText: '紅花籽油',
    normalizedName: '紅花籽油',
    category: 'vegetarian',
    description: '植物性油脂',
    source: 'database',
  },
  {
    originalText: '蜂王漿',
    normalizedName: '蜂王漿',
    category: 'non-vegetarian',
    description: '蜜蜂分泌物',
    source: 'ai',
  },
]

function buildRequest(body: unknown, ip = '5.5.5.5'): Request {
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    __resetRateLimitStore()
    sendMock.mockReset()
    sendMock.mockResolvedValue({ data: { id: 'mock-id' }, error: null })
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('RESEND_API_KEY', 'test_key')
    vi.stubEnv('FEEDBACK_RECIPIENT_EMAIL', 'ops@example.com')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 200 and sends email on valid submission', async () => {
    const res = await POST(
      buildRequest({
        ingredients: validIngredients,
        flaggedIndices: [1],
        dietType: 'vegan',
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('returns 400 invalid_payload when ingredients is missing', async () => {
    const res = await POST(
      buildRequest({ flaggedIndices: [0], dietType: 'vegan' }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('invalid_payload')
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns 400 invalid_payload when ingredients is empty array', async () => {
    const res = await POST(
      buildRequest({
        ingredients: [],
        flaggedIndices: [],
        dietType: 'vegan',
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('invalid_payload')
  })

  it('returns 400 invalid_payload when flaggedIndices is out of range', async () => {
    const res = await POST(
      buildRequest({
        ingredients: validIngredients,
        flaggedIndices: [5],
        dietType: 'vegan',
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('invalid_payload')
  })

  it('returns 400 invalid_payload when dietType is invalid', async () => {
    const res = await POST(
      buildRequest({
        ingredients: validIngredients,
        flaggedIndices: [0],
        dietType: 'pescatarian',
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 invalid_payload when category is invalid', async () => {
    const res = await POST(
      buildRequest({
        ingredients: [
          { ...validIngredients[0], category: 'mystery' },
        ],
        flaggedIndices: [0],
        dietType: 'vegan',
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 invalid_payload when source is invalid', async () => {
    const res = await POST(
      buildRequest({
        ingredients: [
          { ...validIngredients[0], source: 'manual' },
        ],
        flaggedIndices: [0],
        dietType: 'vegan',
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 invalid_payload when userNote exceeds 1000 chars', async () => {
    const res = await POST(
      buildRequest({
        ingredients: validIngredients,
        flaggedIndices: [0],
        dietType: 'vegan',
        userNote: 'x'.repeat(1001),
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 invalid_payload when suggestedCategory is invalid', async () => {
    const res = await POST(
      buildRequest({
        ingredients: validIngredients,
        flaggedIndices: [0],
        dietType: 'vegan',
        suggestedCategory: 'omnivore',
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 empty_feedback when no flagged and no note', async () => {
    const res = await POST(
      buildRequest({
        ingredients: validIngredients,
        flaggedIndices: [],
        dietType: 'vegan',
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('empty_feedback')
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('accepts note-only feedback (empty flagged, non-empty note)', async () => {
    const res = await POST(
      buildRequest({
        ingredients: validIngredients,
        flaggedIndices: [],
        dietType: 'vegan',
        userNote: '整體判定都正確，謝謝',
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(200)
  })

  it('returns 400 payload_too_large when body exceeds 30 KB', async () => {
    const giant = 'x'.repeat(40 * 1024)
    const res = await POST(
      buildRequest({
        ingredients: validIngredients,
        flaggedIndices: [0],
        dietType: 'vegan',
        userNote: giant,
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('payload_too_large')
  })

  it('returns 400 invalid_payload when body is not JSON', async () => {
    const res = await POST(
      buildRequest('not json at all') as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(400)
  })

  it('returns 429 after exceeding feedback rate limit', async () => {
    const validBody = {
      ingredients: validIngredients,
      flaggedIndices: [0],
      dietType: 'vegan',
    }
    for (let i = 0; i < FEEDBACK_MAX_REQUESTS; i++) {
      const res = await POST(buildRequest(validBody, '7.7.7.7') as Parameters<typeof POST>[0])
      expect(res.status).toBe(200)
    }
    const blocked = await POST(buildRequest(validBody, '7.7.7.7') as Parameters<typeof POST>[0])
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('Retry-After')).toBeTruthy()
    void FEEDBACK_BUCKET
  })

  it('returns 500 feedback_failed when RESEND_API_KEY is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(
      buildRequest({
        ingredients: validIngredients,
        flaggedIndices: [0],
        dietType: 'vegan',
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('feedback_failed')
    errorSpy.mockRestore()
  })

  it('returns 500 feedback_failed when Resend API errors', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'transient failure' } })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(
      buildRequest({
        ingredients: validIngredients,
        flaggedIndices: [0],
        dietType: 'vegan',
      }) as Parameters<typeof POST>[0]
    )
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('feedback_failed')
    errorSpy.mockRestore()
  })
})

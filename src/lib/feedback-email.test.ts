import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ClassifiedIngredient } from '@/types/ingredients'

const sendMock = vi.fn()
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

import {
  buildEmailBody,
  sendFeedbackEmail,
  FeedbackEmailConfigError,
  FeedbackEmailSendError,
} from './feedback-email'

const ingredients: ClassifiedIngredient[] = [
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
  {
    originalText: '大蒜粉',
    normalizedName: '大蒜粉',
    category: 'five-pungent',
    description: '五辛',
    source: 'database',
  },
]

describe('buildEmailBody', () => {
  it('separates flagged ingredients from full list', () => {
    const body = buildEmailBody({
      ingredients,
      flaggedIndices: [1],
      dietType: 'vegan',
      clientIp: '203.0.113.5',
    })

    expect(body).toContain('已勾選成分：')
    expect(body).toContain('完整成分清單：')

    const flaggedSection = body.split('已勾選成分：')[1].split('完整成分清單：')[0]
    expect(flaggedSection).toContain('蜂王漿')
    expect(flaggedSection).not.toContain('紅花籽油')
    expect(flaggedSection).not.toContain('大蒜粉')

    const fullSection = body.split('完整成分清單：')[1]
    expect(fullSection).toContain('紅花籽油')
    expect(fullSection).toContain('蜂王漿')
    expect(fullSection).toContain('大蒜粉')
  })

  it('uses Traditional Chinese source labels', () => {
    const body = buildEmailBody({
      ingredients,
      flaggedIndices: [0, 1],
      dietType: 'vegan',
      clientIp: '203.0.113.5',
    })
    expect(body).toContain('[資料庫]')
    expect(body).toContain('[AI]')
    expect(body).not.toContain('[database]')
    expect(body).not.toContain('[ai]')
  })

  it('includes Asia/Taipei timestamp with +08:00 offset', () => {
    const body = buildEmailBody({
      ingredients,
      flaggedIndices: [0],
      dietType: 'vegan',
      clientIp: '203.0.113.5',
    })
    expect(body).toMatch(/送出時間：\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00/)
  })

  it('uses 8-char SHA-256 prefix as IP fingerprint', () => {
    const body = buildEmailBody({
      ingredients,
      flaggedIndices: [0],
      dietType: 'vegan',
      clientIp: '203.0.113.5',
    })
    const match = body.match(/來源識別：IP#([0-9a-f]{8})\b/)
    expect(match).not.toBeNull()
    expect(match![1]).toHaveLength(8)
    expect(body).not.toContain('203.0.113.5')
  })

  it('includes user note when provided', () => {
    const body = buildEmailBody({
      ingredients,
      flaggedIndices: [1],
      dietType: 'lacto-ovo',
      userNote: '蜂王漿其實是動物性',
      clientIp: '1.2.3.4',
    })
    expect(body).toContain('補充說明：')
    expect(body).toContain('蜂王漿其實是動物性')
  })

  it('includes suggested category when provided', () => {
    const body = buildEmailBody({
      ingredients,
      flaggedIndices: [1],
      dietType: 'vegan',
      suggestedCategory: 'non-vegetarian',
      clientIp: '1.2.3.4',
    })
    expect(body).toContain('建議分類')
    expect(body).toContain('non-vegetarian')
  })

  it('handles empty flagged list with note-only feedback', () => {
    const body = buildEmailBody({
      ingredients,
      flaggedIndices: [],
      dietType: 'vegan',
      userNote: '整體判定都正確，謝謝',
      clientIp: '1.2.3.4',
    })
    expect(body).toContain('已勾選成分：')
    expect(body).toContain('（無')
  })
})

describe('sendFeedbackEmail', () => {
  beforeEach(() => {
    sendMock.mockReset()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws FeedbackEmailConfigError when RESEND_API_KEY is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      sendFeedbackEmail({
        ingredients,
        flaggedIndices: [0],
        dietType: 'vegan',
        clientIp: '1.2.3.4',
      })
    ).rejects.toBeInstanceOf(FeedbackEmailConfigError)

    expect(errorSpy).toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('warns and uses default recipient when FEEDBACK_RECIPIENT_EMAIL is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test_key')
    vi.stubEnv('FEEDBACK_RECIPIENT_EMAIL', '')
    sendMock.mockResolvedValue({ data: { id: 'abc' }, error: null })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await sendFeedbackEmail({
      ingredients,
      flaggedIndices: [0],
      dietType: 'vegan',
      clientIp: '1.2.3.4',
    })

    expect(warnSpy).toHaveBeenCalled()
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(sendMock.mock.calls[0][0].to).toBe('mooshi21824@gmail.com')
    expect(sendMock.mock.calls[0][0].from).toBe('onboarding@resend.dev')
    warnSpy.mockRestore()
  })

  it('uses configured recipient when FEEDBACK_RECIPIENT_EMAIL is set', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test_key')
    vi.stubEnv('FEEDBACK_RECIPIENT_EMAIL', 'ops@example.com')
    sendMock.mockResolvedValue({ data: { id: 'abc' }, error: null })

    await sendFeedbackEmail({
      ingredients,
      flaggedIndices: [0],
      dietType: 'vegan',
      clientIp: '1.2.3.4',
    })

    expect(sendMock.mock.calls[0][0].to).toBe('ops@example.com')
  })

  it('subject reflects flagged count', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test_key')
    sendMock.mockResolvedValue({ data: { id: 'abc' }, error: null })

    await sendFeedbackEmail({
      ingredients,
      flaggedIndices: [0, 1],
      dietType: 'vegan',
      clientIp: '1.2.3.4',
    })

    expect(sendMock.mock.calls[0][0].subject).toContain('2 筆')
  })

  it('subject indicates note-only when no flagged items', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test_key')
    sendMock.mockResolvedValue({ data: { id: 'abc' }, error: null })

    await sendFeedbackEmail({
      ingredients,
      flaggedIndices: [],
      dietType: 'vegan',
      userNote: '只想留言',
      clientIp: '1.2.3.4',
    })

    expect(sendMock.mock.calls[0][0].subject).toContain('補充說明')
  })

  it('throws FeedbackEmailSendError when Resend returns an error', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test_key')
    sendMock.mockResolvedValue({ data: null, error: { message: 'rate limited' } })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      sendFeedbackEmail({
        ingredients,
        flaggedIndices: [0],
        dietType: 'vegan',
        clientIp: '1.2.3.4',
      })
    ).rejects.toBeInstanceOf(FeedbackEmailSendError)

    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})

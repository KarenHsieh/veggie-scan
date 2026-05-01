import { describe, it, expect, beforeEach, vi } from 'vitest'

const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
}))

vi.mock('./gemini', () => ({
  model: { generateContent: generateContentMock },
}))

import { parseLabel, parseIngredients } from './parser'

function mockGeminiResponse(payload: unknown): void {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload)
  generateContentMock.mockResolvedValue({
    response: { text: () => text },
  })
}

describe('parseLabel', () => {
  beforeEach(() => {
    generateContentMock.mockReset()
  })

  it('extracts all four notice types from the canonical example', async () => {
    mockGeminiResponse({
      ingredients: [
        { originalText: '砂糖', normalizedName: '砂糖' },
        { originalText: '麵粉', normalizedName: '麵粉' },
        { originalText: '鮮奶', normalizedName: '鮮奶' },
        { originalText: '雞蛋', normalizedName: '雞蛋' },
        { originalText: '可可粉', normalizedName: '可可粉' },
      ],
      notices: [
        { type: 'allergen', text: '本產品含有牛奶、雞蛋及其製品' },
        { type: 'storage', text: '請冷藏保存於 7°C 以下' },
        { type: 'expiration', text: '2026.12.31' },
        { type: 'other', text: '開封後請盡早食用' },
      ],
    })

    const result = await parseLabel('原料：砂糖、麵粉、鮮奶、雞蛋、可可粉\n過敏原：本產品含有牛奶、雞蛋及其製品')

    expect(result.ingredients).toHaveLength(5)
    expect(result.notices).toEqual([
      { type: 'allergen', text: '本產品含有牛奶、雞蛋及其製品' },
      { type: 'storage', text: '請冷藏保存於 7°C 以下' },
      { type: 'expiration', text: '2026.12.31' },
      { type: 'other', text: '開封後請盡早食用' },
    ])
  })

  it('returns empty notices array for ingredients-only input', async () => {
    mockGeminiResponse({
      ingredients: [{ originalText: '砂糖', normalizedName: '砂糖' }],
      notices: [],
    })

    const result = await parseLabel('砂糖')
    expect(result.ingredients).toHaveLength(1)
    expect(result.notices).toEqual([])
  })

  it('falls back to empty array when notices field is missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockGeminiResponse({
      ingredients: [{ originalText: '砂糖', normalizedName: '砂糖' }],
    })

    const result = await parseLabel('砂糖')
    expect(result.notices).toEqual([])
    expect(result.ingredients).toHaveLength(1)
    warnSpy.mockRestore()
  })

  it('warns and falls back when notices field is not an array', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockGeminiResponse({
      ingredients: [{ originalText: '砂糖', normalizedName: '砂糖' }],
      notices: 'not-an-array',
    })

    const result = await parseLabel('砂糖')
    expect(result.notices).toEqual([])
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('drops malformed notice entries (missing text)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockGeminiResponse({
      ingredients: [{ originalText: '砂糖', normalizedName: '砂糖' }],
      notices: [
        { type: 'allergen' }, // missing text
        { type: 'storage', text: '請冷藏' }, // valid
      ],
    })

    const result = await parseLabel('砂糖')
    expect(result.notices).toEqual([{ type: 'storage', text: '請冷藏' }])
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('drops malformed notice entries (missing type)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockGeminiResponse({
      ingredients: [{ originalText: '砂糖', normalizedName: '砂糖' }],
      notices: [
        { text: '某警示' }, // missing type
        { type: 'expiration', text: '2026.12.31' },
      ],
    })

    const result = await parseLabel('砂糖')
    expect(result.notices).toEqual([{ type: 'expiration', text: '2026.12.31' }])
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('downgrades unknown notice types to "other" while preserving text', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockGeminiResponse({
      ingredients: [{ originalText: '砂糖', normalizedName: '砂糖' }],
      notices: [
        { type: 'warning', text: '小心熱燙' },
        { type: 'caution', text: '請勿給三歲以下幼兒食用' },
      ],
    })

    const result = await parseLabel('砂糖')
    expect(result.notices).toEqual([
      { type: 'other', text: '小心熱燙' },
      { type: 'other', text: '請勿給三歲以下幼兒食用' },
    ])
    expect(warnSpy).toHaveBeenCalledTimes(2)
    warnSpy.mockRestore()
  })

  it('preserves original-language notice text without translation', async () => {
    mockGeminiResponse({
      ingredients: [{ originalText: '砂糖', normalizedName: '砂糖' }],
      notices: [{ type: 'expiration', text: '2026.12.31 まで' }],
    })

    const result = await parseLabel('賞味期限：2026.12.31 まで')
    expect(result.notices[0].text).toBe('2026.12.31 まで')
  })

  it('throws when ingredients field is missing entirely', async () => {
    mockGeminiResponse({ notices: [] })
    await expect(parseLabel('garbage')).rejects.toThrow()
  })

  it('throws when response is not valid JSON', async () => {
    mockGeminiResponse('totally not json')
    await expect(parseLabel('garbage')).rejects.toThrow()
  })

  it('handles JSON wrapped in markdown code fence', async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          '```json\n{"ingredients":[{"originalText":"鹽","normalizedName":"鹽"}],"notices":[]}\n```',
      },
    })
    const result = await parseLabel('鹽')
    expect(result.ingredients).toHaveLength(1)
    expect(result.notices).toEqual([])
  })
})

describe('parseIngredients (backwards-compatible wrapper)', () => {
  beforeEach(() => {
    generateContentMock.mockReset()
  })

  it('returns only the ingredients array', async () => {
    mockGeminiResponse({
      ingredients: [
        { originalText: '砂糖', normalizedName: '砂糖' },
        { originalText: '鹽', normalizedName: '鹽' },
      ],
      notices: [{ type: 'allergen', text: '含有牛奶' }],
    })

    const result = await parseIngredients('砂糖、鹽')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ originalText: '砂糖', normalizedName: '砂糖' })
  })
})

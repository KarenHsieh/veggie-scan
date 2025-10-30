import { describe, it, expect } from 'vitest'
import {
  tokenize,
  extractParentheses,
  extractECodes,
  tokenizeWithECodes,
} from '../../lib/text/tokenize.js'

describe('tokenize', () => {
  it('應該以逗號分隔', () => {
    const input = '水,糖,鹽'
    const result = tokenize(input)
    expect(result).toEqual(['水', '糖', '鹽'])
  })

  it('應該以頓號分隔', () => {
    const input = '水、糖、鹽'
    const result = tokenize(input)
    expect(result).toEqual(['水', '糖', '鹽'])
  })

  it('應該以分號分隔', () => {
    const input = '水;糖;鹽'
    const result = tokenize(input)
    expect(result).toEqual(['水', '糖', '鹽'])
  })

  it('應該以空白分隔', () => {
    const input = '水 糖 鹽'
    const result = tokenize(input)
    expect(result).toEqual(['水', '糖', '鹽'])
  })

  it('應該處理混合分隔符', () => {
    const input = '水、糖,鹽;油 醋'
    const result = tokenize(input)
    expect(result).toEqual(['水', '糖', '鹽', '油', '醋'])
  })

  it('應該去除重複項目', () => {
    const input = '水,糖,水,鹽,糖'
    const result = tokenize(input)
    expect(result).toEqual(['水', '糖', '鹽'])
  })

  it('應該過濾空字串', () => {
    const input = '水,,糖,,,鹽'
    const result = tokenize(input)
    expect(result).toEqual(['水', '糖', '鹽'])
  })

  it('應該處理空輸入', () => {
    expect(tokenize('')).toEqual([])
    expect(tokenize(null)).toEqual([])
    expect(tokenize(undefined)).toEqual([])
  })
})

describe('extractParentheses', () => {
  it('應該提取圓括號內容', () => {
    const input = '乳化劑(e471)'
    const result = extractParentheses(input)
    expect(result).toEqual(['e471'])
  })

  it('應該提取全形括號內容', () => {
    const input = '乳化劑（e471）'
    const result = extractParentheses(input)
    expect(result).toEqual(['e471'])
  })

  it('應該提取多個括號', () => {
    const input = '乳化劑(e471)、膨脹劑(e500)'
    const result = extractParentheses(input)
    expect(result).toEqual(['e471', 'e500'])
  })

  it('應該處理無括號的情況', () => {
    const input = '水糖鹽'
    const result = extractParentheses(input)
    expect(result).toEqual([])
  })
})

describe('extractECodes', () => {
  it('應該識別 E-code', () => {
    const tokens = ['e471', 'sugar', 'e322']
    const result = extractECodes(tokens)
    expect(result).toEqual(['E471', 'E322'])
  })

  it('應該識別帶字母後綴的 E-code', () => {
    const tokens = ['e160a', 'e472e']
    const result = extractECodes(tokens)
    expect(result).toEqual(['E160A', 'E472E'])
  })

  it('應該從括號中提取 E-code', () => {
    const tokens = ['乳化劑(e471)', 'sugar']
    const result = extractECodes(tokens)
    expect(result).toEqual(['E471'])
  })

  it('應該去除重複的 E-code', () => {
    const tokens = ['e471', 'sugar', 'e471']
    const result = extractECodes(tokens)
    expect(result).toEqual(['E471'])
  })

  it('應該處理大小寫混合', () => {
    const tokens = ['E471', 'e322', 'E471']
    const result = extractECodes(tokens)
    expect(result).toEqual(['E471', 'E322'])
  })
})

describe('tokenizeWithECodes', () => {
  it('應該分離 E-codes 與一般 tokens', () => {
    const input = '水,糖,e471,鹽,e322'
    const result = tokenizeWithECodes(input)
    expect(result.tokens).toEqual(['水', '糖', '鹽'])
    expect(result.eCodes).toEqual(['E471', 'E322'])
  })

  it('應該處理括號中的 E-codes', () => {
    const input = '水,乳化劑(e471),糖'
    const result = tokenizeWithECodes(input)
    expect(result.tokens).toContain('水')
    expect(result.tokens).toContain('糖')
    expect(result.eCodes).toEqual(['E471'])
  })

  it('應該忽略括號內有 E-code 的 token', () => {
    const input = '水、糖、乳化劑(e471)、卵磷脂'
    const result = tokenizeWithECodes(input)
    expect(result.tokens).toEqual(['水', '糖', '卵磷脂'])
    expect(result.eCodes).toEqual(['E471'])
    // 「乳化劑」不應該出現在 tokens 中，因為它後面的括號內是 E-code
    expect(result.tokens).not.toContain('乳化劑')
  })

  it('應該處理無 E-code 的情況', () => {
    const input = '水,糖,鹽'
    const result = tokenizeWithECodes(input)
    expect(result.tokens).toEqual(['水', '糖', '鹽'])
    expect(result.eCodes).toEqual([])
  })

  it('應該處理完整成分列表', () => {
    const input = '水、小麥粉、糖、植物油、食鹽、乳化劑(e471)、膨脹劑(e500)'
    const result = tokenizeWithECodes(input)
    expect(result.tokens).toContain('水')
    expect(result.tokens).toContain('小麥粉')
    expect(result.eCodes).toEqual(['E471', 'E500'])
  })
})

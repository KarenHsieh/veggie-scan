import { describe, it, expect } from 'vitest'
import { normalize, normalizeIngredients } from '../../lib/text/normalize.js'

describe('normalize', () => {
  it('應該將全形轉為半形', () => {
    const input = 'Ｅ４７１'
    const result = normalize(input)
    expect(result).toBe('e471')
  })

  it('應該將英文轉為小寫', () => {
    const input = 'E471, Lecithin, SUGAR'
    const result = normalize(input)
    expect(result).toBe('e471, lecithin, sugar')
  })

  it('應該移除多餘空白', () => {
    const input = '水   糖    鹽'
    const result = normalize(input)
    expect(result).toBe('水 糖 鹽')
  })

  it('應該移除特殊符號但保留必要分隔符', () => {
    const input = '水、糖！鹽@油#'
    const result = normalize(input)
    expect(result).toBe('水、糖鹽油')
  })

  it('應該處理混合中英文', () => {
    const input = '水、Sugar、鹽、E471'
    const result = normalize(input)
    expect(result).toBe('水、sugar、鹽、e471')
  })

  it('應該處理空字串', () => {
    expect(normalize('')).toBe('')
    expect(normalize(null)).toBe('')
    expect(normalize(undefined)).toBe('')
  })

  it('應該保留括號', () => {
    const input = '乳化劑(E471)'
    const result = normalize(input)
    expect(result).toBe('乳化劑(e471)')
  })

  it('應該處理複雜成分列表', () => {
    const input = '水、小麥粉、糖、植物油（棕櫚油）、食鹽、乳化劑（E471）、膨脹劑'
    const result = normalize(input)
    expect(result).toContain('水')
    expect(result).toContain('e471')
  })
})

describe('normalizeIngredients', () => {
  it('應該將換行符號轉為逗號', () => {
    const input = '水\n糖\n鹽'
    const result = normalizeIngredients(input)
    expect(result).toBe('水,糖,鹽')
  })

  it('應該處理多種換行符號', () => {
    const input = '水\r\n糖\n鹽\r油'
    const result = normalizeIngredients(input)
    expect(result).toContain('水')
    expect(result).toContain('糖')
  })

  it('應該同時執行標準化', () => {
    const input = 'Ｗａｔｅｒ\nＳｕｇａｒ\nＳａｌｔ'
    const result = normalizeIngredients(input)
    expect(result).toBe('water,sugar,salt')
  })
})

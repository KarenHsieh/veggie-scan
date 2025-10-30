import { describe, it, expect } from 'vitest'
import { classify, getFinalVerdict, matchECode, matchIngredient } from '../../lib/rules/classify.js'

describe('matchECode', () => {
  it('應該精確匹配 E-code', () => {
    const result = matchECode('E471')
    expect(result).toBeTruthy()
    expect(result.matched).toBe(true)
    expect(result.matchType).toBe('exact')
    expect(result.item.code).toBe('E471')
  })

  it('應該不區分大小寫', () => {
    const result = matchECode('e471')
    expect(result).toBeTruthy()
    expect(result.item.code).toBe('E471')
  })

  it('應該匹配帶字母後綴的 E-code', () => {
    const result = matchECode('E160a')
    expect(result).toBeTruthy()
    expect(result.item.code).toBe('E160a')
  })

  it('應該回傳 null 當找不到匹配', () => {
    const result = matchECode('E9999')
    expect(result).toBeNull()
  })
})

describe('matchIngredient', () => {
  it('應該精確匹配中文名稱', () => {
    const result = matchIngredient('豬油')
    expect(result).toBeTruthy()
    expect(result.matched).toBe(true)
    expect(result.matchType).toBe('exact')
  })

  it('應該精確匹配英文名稱', () => {
    const result = matchIngredient('lard')
    expect(result).toBeTruthy()
    expect(result.item.name).toBe('豬油')
  })

  it('應該匹配別名', () => {
    const result = matchIngredient('豬脂')
    expect(result).toBeTruthy()
    expect(result.matchType).toBe('alias')
    expect(result.item.name).toBe('豬油')
  })

  it('應該不區分大小寫', () => {
    const result = matchIngredient('LARD')
    expect(result).toBeTruthy()
    expect(result.item.name).toBe('豬油')
  })

  it('應該回傳 null 當找不到匹配', () => {
    const result = matchIngredient('未知成分xyz')
    expect(result).toBeNull()
  })
})

describe('classify', () => {
  it('應該正確分類安全成分', () => {
    const tokenData = {
      tokens: ['水', '糖', '鹽'],
      eCodes: [],
    }
    const result = classify(tokenData)
    
    expect(result.safe.length).toBeGreaterThan(0)
    expect(result.danger.length).toBe(0)
  })

  it('應該正確識別危險成分', () => {
    const tokenData = {
      tokens: ['豬油', '雞肉'],
      eCodes: [],
    }
    const result = classify(tokenData)
    
    expect(result.danger.length).toBe(2)
  })

  it('應該正確處理 E-codes', () => {
    const tokenData = {
      tokens: [],
      eCodes: ['E471', 'E330'],
    }
    const result = classify(tokenData)
    
    // E471 是 warning/danger (可能含動物脂肪)
    // E330 是 safe (檸檬酸)
    expect(result.danger.length + result.warning.length).toBeGreaterThan(0)
  })

  it('應該處理混合成分', () => {
    const tokenData = {
      tokens: ['水', '糖', '豬油'],
      eCodes: ['E471'],
    }
    const result = classify(tokenData)
    
    expect(result.safe.length).toBeGreaterThan(0)
    expect(result.danger.length).toBeGreaterThan(0)
  })

  it('應該標記未知成分', () => {
    const tokenData = {
      tokens: ['未知成分A', '未知成分B'],
      eCodes: [],
    }
    const result = classify(tokenData)
    
    expect(result.unknown.length).toBe(2)
  })
})

describe('getFinalVerdict', () => {
  it('應該回傳 danger 當有危險成分', () => {
    const classifyResults = {
      safe: [{ input: '水' }],
      warning: [],
      danger: [{ input: '豬油' }],
      unknown: [],
    }
    const verdict = getFinalVerdict(classifyResults)
    expect(verdict).toBe('danger')
  })

  it('應該回傳 warning 當有警告成分', () => {
    const classifyResults = {
      safe: [{ input: '水' }],
      warning: [{ input: 'E471' }],
      danger: [],
      unknown: [],
    }
    const verdict = getFinalVerdict(classifyResults)
    expect(verdict).toBe('warning')
  })

  it('應該回傳 warning 當有未知成分', () => {
    const classifyResults = {
      safe: [{ input: '水' }],
      warning: [],
      danger: [],
      unknown: [{ input: '未知成分' }],
    }
    const verdict = getFinalVerdict(classifyResults)
    expect(verdict).toBe('warning')
  })

  it('應該回傳 safe 當全部安全', () => {
    const classifyResults = {
      safe: [{ input: '水' }, { input: '糖' }],
      warning: [],
      danger: [],
      unknown: [],
    }
    const verdict = getFinalVerdict(classifyResults)
    expect(verdict).toBe('safe')
  })
})

describe('完整流程測試', () => {
  it('應該正確處理素食安全的成分列表', () => {
    const tokenData = {
      tokens: ['水', '糖', '小麥粉', '植物油'],
      eCodes: ['E330'], // 檸檬酸
    }
    const result = classify(tokenData)
    const verdict = getFinalVerdict(result)
    
    expect(verdict).toBe('safe')
  })

  it('應該正確處理含動物成分的列表', () => {
    const tokenData = {
      tokens: ['水', '糖', '豬油'],
      eCodes: [],
    }
    const result = classify(tokenData)
    const verdict = getFinalVerdict(result)
    
    expect(verdict).toBe('danger')
  })

  it('應該正確處理需確認的成分列表', () => {
    const tokenData = {
      tokens: ['水', '糖'],
      eCodes: ['E471'], // 可能含動物脂肪
    }
    const result = classify(tokenData)
    const verdict = getFinalVerdict(result)
    
    expect(verdict).toBe('warning')
  })

  it('應該正確處理「乳化劑(E471)、卵磷脂」情境', () => {
    const tokenData = {
      tokens: ['水', '糖', '卵磷脂'], // 乳化劑已被忽略
      eCodes: ['E471'],
    }
    const result = classify(tokenData)
    const verdict = getFinalVerdict(result)
    
    // 應該有 2 項 safe（水、糖）
    expect(result.safe.length).toBe(2)
    
    // 應該有 2 項 warning（E471、卵磷脂/E322）
    expect(result.warning.length).toBe(2)
    
    // 最終判斷應該是 warning
    expect(verdict).toBe('warning')
    
    // 驗證卵磷脂被正確匹配到 E322
    const lecithinMatch = result.warning.find(item => item.input === '卵磷脂')
    expect(lecithinMatch).toBeTruthy()
    expect(lecithinMatch.item.code).toBe('E322')
  })
})

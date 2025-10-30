import { describe, it, expect } from 'vitest'
import { explain, generateSummaryText } from '../../lib/rules/explain.js'

describe('explain', () => {
  it('應該為 safe 結果生成正確說明', () => {
    const classifyResults = {
      safe: [
        { input: '水', matched: true, item: { name: '水', vegetarian: true, vegan: true, risk: 'low' } },
        { input: '糖', matched: true, item: { name: '糖', vegetarian: true, vegan: true, risk: 'low' } },
      ],
      warning: [],
      danger: [],
      unknown: [],
    }
    const finalVerdict = 'safe'
    
    const result = explain(classifyResults, finalVerdict)
    
    expect(result.verdict).toBe('safe')
    expect(result.icon).toBe('✅')
    expect(result.title).toBe('可食用')
    expect(result.summary.safe).toBe(2)
    expect(result.summary.total).toBe(2)
    expect(result.details.safe.length).toBe(2)
  })

  it('應該為 danger 結果生成正確說明', () => {
    const classifyResults = {
      safe: [
        { input: '水', matched: true, item: { name: '水', vegetarian: true, vegan: true, risk: 'low' } },
      ],
      warning: [],
      danger: [
        { input: '豬油', matched: true, item: { name: '豬油', vegetarian: false, vegan: false, risk: 'high' } },
        { input: '雞肉', matched: true, item: { name: '雞肉', vegetarian: false, vegan: false, risk: 'high' } },
      ],
      unknown: [],
    }
    const finalVerdict = 'danger'
    
    const result = explain(classifyResults, finalVerdict)
    
    expect(result.verdict).toBe('danger')
    expect(result.icon).toBe('❌')
    expect(result.title).toBe('不可食用')
    expect(result.summary.danger).toBe(2)
    expect(result.summary.safe).toBe(1)
    expect(result.summary.total).toBe(3)
    expect(result.details.danger.length).toBe(2)
  })

  it('應該為 warning 結果生成正確說明', () => {
    const classifyResults = {
      safe: [
        { input: '水', matched: true, item: { name: '水', vegetarian: true, vegan: true, risk: 'low' } },
      ],
      warning: [
        { input: 'E471', matched: true, item: { code: 'E471', name: '脂肪酸單甘油酯', vegetarian: true, vegan: false, risk: 'high' } },
      ],
      danger: [],
      unknown: [],
    }
    const finalVerdict = 'warning'
    
    const result = explain(classifyResults, finalVerdict)
    
    expect(result.verdict).toBe('warning')
    expect(result.icon).toBe('⚠️')
    expect(result.title).toBe('需確認')
    expect(result.summary.warning).toBe(1)
    expect(result.summary.safe).toBe(1)
    expect(result.details.warning.length).toBe(1)
  })

  it('應該處理未知成分', () => {
    const classifyResults = {
      safe: [],
      warning: [],
      danger: [],
      unknown: [
        { input: '未知成分A', matched: false },
        { input: '未知成分B', matched: false },
      ],
    }
    const finalVerdict = 'warning'
    
    const result = explain(classifyResults, finalVerdict)
    
    expect(result.summary.unknown).toBe(2)
    expect(result.details.unknown.length).toBe(2)
    expect(result.details.unknown[0].status).toBe('unknown')
    expect(result.details.unknown[0].reason).toBe('此成分不在資料庫中')
  })

  it('應該為匹配結果生成正確的理由', () => {
    const classifyResults = {
      safe: [],
      warning: [],
      danger: [
        { 
          input: '豬油', 
          matched: true, 
          matchType: 'exact',
          item: { 
            name: '豬油', 
            nameEn: 'lard',
            vegetarian: false, 
            vegan: false, 
            risk: 'high',
            notes: '動物脂肪，非素食',
            category: '油脂'
          } 
        },
      ],
      unknown: [],
    }
    const finalVerdict = 'danger'
    
    const result = explain(classifyResults, finalVerdict)
    
    const dangerItem = result.details.danger[0]
    expect(dangerItem.displayName).toBe('豬油')
    expect(dangerItem.reason).toBe('含有動物成分，非素食')
    expect(dangerItem.notes).toBe('動物脂肪，非素食')
    expect(dangerItem.category).toBe('油脂')
  })

  it('應該為模糊匹配加上相似度提示', () => {
    const classifyResults = {
      safe: [],
      warning: [
        { 
          input: 'lrd', 
          matched: true, 
          matchType: 'fuzzy',
          confidence: 0.87,
          item: { 
            name: '豬油', 
            nameEn: 'lard',
            vegetarian: false, 
            vegan: false, 
            risk: 'high'
          } 
        },
      ],
      danger: [],
      unknown: [],
    }
    const finalVerdict = 'warning'
    
    const result = explain(classifyResults, finalVerdict)
    
    const warningItem = result.details.warning[0]
    expect(warningItem.reason).toContain('(相似度: 87%)')
  })

  it('應該正確處理「乳化劑(E471)、卵磷脂」情境', () => {
    const classifyResults = {
      safe: [
        { input: '水', matched: true, item: { name: '水', vegetarian: true, vegan: true, risk: 'low' } },
        { input: '糖', matched: true, item: { name: '糖', vegetarian: true, vegan: true, risk: 'low' } },
      ],
      warning: [
        { 
          input: 'E471', 
          matched: true, 
          matchType: 'exact',
          item: { 
            code: 'E471',
            name: '脂肪酸單甘油酯', 
            vegetarian: true, 
            vegan: false, 
            risk: 'high',
            notes: '乳化劑，可能含動物脂肪，需確認來源'
          } 
        },
        { 
          input: '卵磷脂', 
          matched: true, 
          matchType: 'exact',
          item: { 
            code: 'E322',
            name: '卵磷脂', 
            vegetarian: true, 
            vegan: true, 
            risk: 'medium',
            notes: '乳化劑，可能來自大豆或蛋黃，需確認來源'
          } 
        },
      ],
      danger: [],
      unknown: [],
    }
    const finalVerdict = 'warning'
    
    const result = explain(classifyResults, finalVerdict)
    
    expect(result.verdict).toBe('warning')
    expect(result.summary.safe).toBe(2)
    expect(result.summary.warning).toBe(2)
    expect(result.summary.total).toBe(4)
    expect(result.details.warning.length).toBe(2)
  })
})

describe('generateSummaryText', () => {
  it('應該為 safe 生成正確摘要', () => {
    const explanation = {
      verdict: 'safe',
      summary: {
        total: 5,
        safe: 5,
        warning: 0,
        danger: 0,
        unknown: 0,
      },
    }
    
    const result = generateSummaryText(explanation)
    expect(result).toBe('✅ 全部 5 項成分皆為素食可食用')
  })

  it('應該為 danger 生成正確摘要', () => {
    const explanation = {
      verdict: 'danger',
      summary: {
        total: 5,
        safe: 3,
        warning: 0,
        danger: 2,
        unknown: 0,
      },
    }
    
    const result = generateSummaryText(explanation)
    expect(result).toBe('❌ 發現 2 項不可食用成分')
  })

  it('應該為 warning 生成正確摘要', () => {
    const explanation = {
      verdict: 'warning',
      summary: {
        total: 5,
        safe: 3,
        warning: 2,
        danger: 0,
        unknown: 0,
      },
    }
    
    const result = generateSummaryText(explanation)
    expect(result).toBe('⚠️ 有 2 項成分需要確認來源')
  })

  it('應該將 warning 和 unknown 合併計算', () => {
    const explanation = {
      verdict: 'warning',
      summary: {
        total: 6,
        safe: 3,
        warning: 2,
        danger: 0,
        unknown: 1,
      },
    }
    
    const result = generateSummaryText(explanation)
    expect(result).toBe('⚠️ 有 3 項成分需要確認來源')
  })

  it('應該處理「乳化劑(E471)、卵磷脂」情境的摘要', () => {
    const explanation = {
      verdict: 'warning',
      summary: {
        total: 4,
        safe: 2,
        warning: 2,
        danger: 0,
        unknown: 0,
      },
    }
    
    const result = generateSummaryText(explanation)
    expect(result).toBe('⚠️ 有 2 項成分需要確認來源')
  })
})

/**
 * 成分分類與判斷引擎
 * 負責比對成分並判斷素食適用性
 */

import eCodesData from '../../data/e-codes.json'
import ingredientsData from '../../data/ingredients.base.json'

/**
 * 計算 Levenshtein 距離（用於模糊比對）
 * @param {string} a - 字串 A
 * @param {string} b - 字串 B
 * @returns {number} 編輯距離
 */
function levenshteinDistance(a, b) {
  const matrix = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * 計算相似度（0-1 之間）
 * @param {string} a - 字串 A
 * @param {string} b - 字串 B
 * @returns {number} 相似度分數
 */
function similarity(a, b) {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase())
  const maxLength = Math.max(a.length, b.length)
  return maxLength === 0 ? 1 : 1 - distance / maxLength
}

/**
 * 比對 E-code
 * @param {string} eCode - E-code (例如 "E471")
 * @returns {object|null} 比對結果
 */
export function matchECode(eCode) {
  const normalizedCode = eCode.toUpperCase()
  
  // 精確匹配
  const exactMatch = eCodesData.find(item => item.code.toUpperCase() === normalizedCode)
  if (exactMatch) {
    return {
      matched: true,
      item: exactMatch,
      matchType: 'exact',
      confidence: 1.0,
    }
  }

  // 模糊匹配（相似度 >= 0.85）
  for (const item of eCodesData) {
    const sim = similarity(normalizedCode, item.code)
    if (sim >= 0.85) {
      return {
        matched: true,
        item: item,
        matchType: 'fuzzy',
        confidence: sim,
      }
    }
  }

  return null
}

/**
 * 比對一般成分
 * @param {string} token - 成分名稱
 * @returns {object|null} 比對結果
 */
export function matchIngredient(token) {
  const normalizedToken = token.toLowerCase()

  // 合併兩個資料庫進行搜尋
  const allData = [...ingredientsData, ...eCodesData]

  // 1. 精確匹配名稱
  const exactMatch = allData.find(
    item => item.name.toLowerCase() === normalizedToken || 
            (item.nameEn && item.nameEn.toLowerCase() === normalizedToken)
  )
  if (exactMatch) {
    return {
      matched: true,
      item: exactMatch,
      matchType: 'exact',
      confidence: 1.0,
    }
  }

  // 2. 別名匹配
  for (const item of allData) {
    if (item.aliases && item.aliases.some(alias => alias.toLowerCase() === normalizedToken)) {
      return {
        matched: true,
        item: item,
        matchType: 'alias',
        confidence: 1.0,
      }
    }
  }

  // 3. 模糊匹配（相似度 >= 0.85）
  for (const item of allData) {
    const nameSim = similarity(normalizedToken, item.name)
    const nameEnSim = item.nameEn ? similarity(normalizedToken, item.nameEn) : 0
    const maxSim = Math.max(nameSim, nameEnSim)

    if (maxSim >= 0.85) {
      return {
        matched: true,
        item: item,
        matchType: 'fuzzy',
        confidence: maxSim,
      }
    }
  }

  return null
}

/**
 * 判斷單一成分的素食適用性
 * @param {object} matchResult - 比對結果
 * @returns {string} 'safe' | 'warning' | 'danger'
 */
function determineStatus(matchResult) {
  if (!matchResult || !matchResult.matched) {
    return 'unknown'
  }

  const { item } = matchResult

  // 規則優先序：
  // 1. 非素食（含肉類、明膠等）-> danger
  // 2. 素食但需確認來源（蛋奶、可能含動物成分）-> warning
  // 3. 純素且低風險 -> safe
  
  // 非素食（vegetarian: false）-> danger
  if (item.vegetarian === false) {
    return 'danger'
  }

  // 純素且低風險 -> safe
  if (item.vegan === true && item.risk === 'low') {
    return 'safe'
  }

  // 素食但非純素（蛋奶類）-> warning
  if (item.vegetarian === true && item.vegan === false) {
    return 'warning'
  }

  // 風險中等或高 -> warning
  if (item.risk === 'medium' || item.risk === 'high') {
    return 'warning'
  }

  // 其他情況 -> warning
  return 'warning'
}

/**
 * 分類成分列表
 * @param {object} tokenData - { tokens: string[], eCodes: string[] }
 * @returns {object} 分類結果
 */
export function classify(tokenData) {
  const { tokens = [], eCodes = [] } = tokenData

  const results = {
    safe: [],      // ✅ 可食
    warning: [],   // ⚠️ 需確認
    danger: [],    // ❌ 不可食
    unknown: [],   // ❓ 未知
  }

  // 處理 E-codes
  eCodes.forEach(eCode => {
    const match = matchECode(eCode)
    if (match) {
      const status = determineStatus(match)
      results[status].push({
        input: eCode,
        ...match,
      })
    } else {
      results.unknown.push({
        input: eCode,
        matched: false,
      })
    }
  })

  // 處理一般成分
  tokens.forEach(token => {
    const match = matchIngredient(token)
    if (match) {
      const status = determineStatus(match)
      results[status].push({
        input: token,
        ...match,
      })
    } else {
      results.unknown.push({
        input: token,
        matched: false,
      })
    }
  })

  return results
}

/**
 * 取得最終判斷結果
 * @param {object} classifyResults - classify() 的結果
 * @returns {string} 'safe' | 'warning' | 'danger'
 */
export function getFinalVerdict(classifyResults) {
  // 有任何 danger -> danger
  if (classifyResults.danger.length > 0) {
    return 'danger'
  }

  // 有 warning 或 unknown -> warning
  if (classifyResults.warning.length > 0 || classifyResults.unknown.length > 0) {
    return 'warning'
  }

  // 全部 safe -> safe
  return 'safe'
}

export default {
  classify,
  getFinalVerdict,
  matchECode,
  matchIngredient,
}

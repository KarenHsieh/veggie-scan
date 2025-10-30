/**
 * 分詞模組
 * 負責將標準化後的文字拆分成 token 陣列
 */

/**
 * 分詞函式
 * @param {string} text - 標準化後的文字
 * @returns {string[]} token 陣列
 */
export function tokenize(text) {
  if (!text || typeof text !== 'string') {
    return []
  }

  // 以逗號、頓號、分號、空白作為分隔符
  const tokens = text
    .split(/[,，、;；\s]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)

  // 去重
  return [...new Set(tokens)]
}

/**
 * 提取括號內容
 * 例如：「乳化劑(E471)」-> 提取出 「E471」
 * @param {string} text - 輸入文字
 * @returns {string[]} 括號內的內容陣列
 */
export function extractParentheses(text) {
  if (!text || typeof text !== 'string') {
    return []
  }

  const regex = /[（(]([^）)]+)[）)]/g
  const matches = []
  let match

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1].trim())
  }

  return matches
}

/**
 * 提取 E-code
 * 例如：「E471」、「e322」
 * @param {string[]} tokens - token 陣列
 * @returns {string[]} E-code 陣列
 */
export function extractECodes(tokens) {
  const eCodes = []

  tokens.forEach((token) => {
    // 匹配 E 開頭 + 數字（可能有字母後綴）
    const match = token.match(/^e\d+[a-z]?$/i)
    if (match) {
      eCodes.push(token.toUpperCase())
    }

    // 檢查括號內容
    const parenthesesContent = extractParentheses(token)
    parenthesesContent.forEach((content) => {
      const eMatch = content.match(/^e\d+[a-z]?$/i)
      if (eMatch) {
        eCodes.push(content.toUpperCase())
      }
    })
  })

  return [...new Set(eCodes)]
}

/**
 * 完整的 tokenize 處理
 * 包含提取 E-codes 與一般 tokens
 * @param {string} text - 標準化後的文字
 * @returns {object} { tokens: string[], eCodes: string[] }
 */
export function tokenizeWithECodes(text) {
  const tokens = tokenize(text)
  const eCodes = extractECodes(tokens)

  // 移除已識別為 E-code 的 token，並處理括號內容
  const regularTokens = tokens
    .filter((token) => !eCodes.includes(token.toUpperCase()))
    .map((token) => {
      // 檢查括號內是否有 E-code
      const parenthesesContent = extractParentheses(token)
      const hasECode = parenthesesContent.some(content => 
        /^e\d+[a-z]?$/i.test(content)
      )
      
      // 如果括號內有 E-code，則忽略這個 token（因為 E-code 已經被提取）
      if (hasECode) {
        return null
      }
      
      // 否則移除括號內容，保留主要名稱
      return token.replace(/[()（）][^()（）]*[()（）]/g, '').trim()
    })
    .filter((token) => token !== null && token.length > 0)

  // 去重
  const uniqueTokens = [...new Set(regularTokens)]

  return {
    tokens: uniqueTokens,
    eCodes,
  }
}

export default {
  tokenize,
  extractParentheses,
  extractECodes,
  tokenizeWithECodes,
}

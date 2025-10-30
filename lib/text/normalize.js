/**
 * 文字標準化模組
 * 負責清洗與標準化輸入文字
 */

/**
 * 全形轉半形
 * @param {string} str - 輸入字串
 * @returns {string} 轉換後的字串
 */
function toHalfWidth(str) {
  return str.replace(/[\uff01-\uff5e]/g, (ch) => {
    return String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  })
}

/**
 * 移除多餘空白
 * @param {string} str - 輸入字串
 * @returns {string} 清理後的字串
 */
function removeExtraSpaces(str) {
  return str.replace(/\s+/g, ' ').trim()
}

/**
 * 移除特殊符號（保留必要的分隔符）
 * @param {string} str - 輸入字串
 * @returns {string} 清理後的字串
 */
function removeSpecialChars(str) {
  // 保留：逗號、頓號、分號、括號、數字、字母、中文、空白、連字號
  return str.replace(/[^\w\s,，、;；()（）\-\u4e00-\u9fa5]/g, '')
}

/**
 * 統一大小寫（英文轉小寫）
 * @param {string} str - 輸入字串
 * @returns {string} 轉換後的字串
 */
function toLowerCase(str) {
  return str.toLowerCase()
}

/**
 * 主要標準化函式
 * @param {string} text - 原始輸入文字
 * @returns {string} 標準化後的文字
 */
export function normalize(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  let result = text

  // 1. 全形轉半形
  result = toHalfWidth(result)

  // 2. 統一小寫
  result = toLowerCase(result)

  // 3. 移除特殊符號
  result = removeSpecialChars(result)

  // 4. 移除多餘空白
  result = removeExtraSpaces(result)

  return result
}

/**
 * 標準化成分列表（處理多行文字）
 * @param {string} text - 原始成分文字
 * @returns {string} 標準化後的文字
 */
export function normalizeIngredients(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // 將換行符號轉為逗號
  let result = text.replace(/[\n\r]+/g, ',')

  // 執行標準化
  result = normalize(result)

  return result
}

export default {
  normalize,
  normalizeIngredients,
}

/**
 * 解釋模組
 * 負責為判斷結果生成人類可讀的說明文字
 */

/**
 * 取得狀態圖示
 * @param {string} status - 'safe' | 'warning' | 'danger'
 * @returns {string} 圖示
 */
function getStatusIcon(status) {
  const icons = {
    safe: '✅',
    warning: '⚠️',
    danger: '❌',
    unknown: '❓',
  }
  return icons[status] || '❓'
}

/**
 * 取得狀態標題
 * @param {string} status - 'safe' | 'warning' | 'danger'
 * @returns {string} 標題文字
 */
function getStatusTitle(status) {
  const titles = {
    safe: '可食用',
    warning: '需確認',
    danger: '不可食用',
    unknown: '未知成分',
  }
  return titles[status] || '未知'
}

/**
 * 取得狀態說明
 * @param {string} status - 'safe' | 'warning' | 'danger'
 * @returns {string} 說明文字
 */
function getStatusDescription(status) {
  const descriptions = {
    safe: '此產品的成分皆為素食可食用',
    warning: '此產品含有需要確認來源的成分，建議進一步查證',
    danger: '此產品含有動物來源成分，不適合素食者',
    unknown: '部分成分無法識別，建議人工確認',
  }
  return descriptions[status] || '無法判斷'
}

/**
 * 為單一匹配結果生成說明
 * @param {object} match - 匹配結果
 * @returns {object} 說明物件
 */
function explainMatch(match) {
  if (!match.matched) {
    return {
      name: match.input,
      displayName: match.input,
      status: 'unknown',
      reason: '此成分不在資料庫中',
      notes: '建議手動查證或聯繫製造商確認',
      category: '未知',
    }
  }

  const { item, matchType, confidence } = match
  const displayName = item.name || item.nameEn || match.input

  let reason = ''
  
  // 根據素食/純素狀態生成理由
  if (item.vegetarian === false) {
    reason = '含有動物成分，非素食'
  } else if (item.vegan === false) {
    reason = '可能含有蛋奶等動物產品，非純素'
  } else if (item.risk === 'high') {
    reason = '可能含有動物來源，需確認製程'
  } else if (item.risk === 'medium') {
    reason = '來源不確定，建議確認'
  } else {
    reason = '植物來源，素食可食'
  }

  // 如果是模糊匹配，加上提示
  if (matchType === 'fuzzy') {
    reason += ` (相似度: ${(confidence * 100).toFixed(0)}%)`
  }

  return {
    name: match.input,
    displayName: displayName,
    status: determineStatusFromItem(item),
    reason: reason,
    notes: item.notes || '',
    category: item.category || 'E添加物',
    vegetarian: item.vegetarian,
    vegan: item.vegan,
    risk: item.risk,
  }
}

/**
 * 從 item 判斷狀態
 * @param {object} item - 成分資料
 * @returns {string} 狀態
 */
function determineStatusFromItem(item) {
  if (item.vegetarian === false) {
    return 'danger'
  }
  if (item.vegetarian === true && item.vegan === false && item.risk === 'high') {
    return 'danger'
  }
  if (item.risk === 'medium') {
    return 'warning'
  }
  if (item.vegan === true && item.risk === 'low') {
    return 'safe'
  }
  return 'warning'
}

/**
 * 為分類結果生成完整說明
 * @param {object} classifyResults - classify() 的結果
 * @param {string} finalVerdict - 最終判斷結果
 * @returns {object} 完整說明物件
 */
export function explain(classifyResults, finalVerdict) {
  const explanation = {
    verdict: finalVerdict,
    icon: getStatusIcon(finalVerdict),
    title: getStatusTitle(finalVerdict),
    description: getStatusDescription(finalVerdict),
    details: {
      safe: [],
      warning: [],
      danger: [],
      unknown: [],
    },
    summary: {
      total: 0,
      safe: 0,
      warning: 0,
      danger: 0,
      unknown: 0,
    },
  }

  // 處理各類別的匹配結果
  Object.keys(classifyResults).forEach(status => {
    const matches = classifyResults[status]
    explanation.details[status] = matches.map(match => explainMatch(match))
    explanation.summary[status] = matches.length
    explanation.summary.total += matches.length
  })

  return explanation
}

/**
 * 生成簡短摘要文字
 * @param {object} explanation - explain() 的結果
 * @returns {string} 摘要文字
 */
export function generateSummaryText(explanation) {
  const { summary, verdict } = explanation
  
  if (verdict === 'safe') {
    return `✅ 全部 ${summary.total} 項成分皆為素食可食用`
  }
  
  if (verdict === 'danger') {
    return `❌ 發現 ${summary.danger} 項不可食用成分`
  }
  
  if (verdict === 'warning') {
    const warningCount = summary.warning + summary.unknown
    return `⚠️ 有 ${warningCount} 項成分需要確認來源`
  }
  
  return '❓ 無法判斷'
}

export default {
  explain,
  generateSummaryText,
  explainMatch,
}

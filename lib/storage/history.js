/**
 * localStorage 歷史記錄管理模組
 * 儲存最近 10 筆查詢記錄
 */

const HISTORY_KEY = 'veggie-scan-history'
const MAX_HISTORY = 10

/**
 * 取得歷史記錄
 * @returns {Array} 歷史記錄陣列
 */
export function getHistory() {
  if (typeof window === 'undefined') return []
  
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('讀取歷史記錄失敗:', error)
    return []
  }
}

/**
 * 新增歷史記錄
 * @param {object} record - 記錄物件 { text, result, timestamp }
 */
export function addHistory(record) {
  if (typeof window === 'undefined') return
  
  try {
    const history = getHistory()
    
    // 建立新記錄
    const newRecord = {
      id: Date.now().toString(),
      text: record.text,
      summary: record.result.summary,
      verdict: record.result.explanation.verdict,
      icon: record.result.explanation.icon,
      timestamp: Date.now(),
    }
    
    // 加到最前面
    history.unshift(newRecord)
    
    // 只保留最近 10 筆
    const limitedHistory = history.slice(0, MAX_HISTORY)
    
    // 儲存
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory))
  } catch (error) {
    console.error('儲存歷史記錄失敗:', error)
  }
}

/**
 * 刪除單筆歷史記錄
 * @param {string} id - 記錄 ID
 */
export function deleteHistory(id) {
  if (typeof window === 'undefined') return
  
  try {
    const history = getHistory()
    const filtered = history.filter(record => record.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('刪除歷史記錄失敗:', error)
  }
}

/**
 * 清空所有歷史記錄
 */
export function clearHistory() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch (error) {
    console.error('清空歷史記錄失敗:', error)
  }
}

/**
 * 格式化時間戳記
 * @param {number} timestamp - 時間戳記
 * @returns {string} 格式化的時間字串
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // 小於 1 分鐘
  if (diff < 60000) {
    return '剛剛'
  }
  
  // 小於 1 小時
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} 分鐘前`
  }
  
  // 小於 1 天
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} 小時前`
  }
  
  // 小於 7 天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days} 天前`
  }
  
  // 超過 7 天，顯示日期
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default {
  getHistory,
  addHistory,
  deleteHistory,
  clearHistory,
  formatTimestamp,
}

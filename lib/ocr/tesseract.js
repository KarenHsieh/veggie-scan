/**
 * Tesseract.js OCR 模組
 * 負責從圖片中提取文字
 */

import { createWorker } from 'tesseract.js'

/**
 * 清理 OCR 辨識後的文字
 * 移除字與字之間多餘的空白
 * @param {string} text - OCR 辨識的原始文字
 * @returns {string} 清理後的文字
 */
export function cleanOCRText(text) {
  if (!text) return ''

  // 先按行分割，對每一行單獨處理
  const lines = text.split('\n')
  
  const cleanedLines = lines.map(line => {
    let result = line

    // 重複執行多次以處理連續的空白
    for (let i = 0; i < 3; i++) {
      result = result
        // 移除中文字之間的空白
        .replace(/([一-龥])\s+([一-龥])/g, '$1$2')
        // 移除中文與標點符號之間的空白（包含冒號）
        .replace(/([一-龥])\s+([，。、：:；！？（）「」『』【】\-])/g, '$1$2')
        .replace(/([，。、：:；！？（）「」『』【】\-])\s+([一-龥])/g, '$1$2')
        // 移除中文與括號之間的空白
        .replace(/([一-龥])\s+([()（）])/g, '$1$2')
        .replace(/([()（）])\s+([一-龥])/g, '$1$2')
        // 移除括號內的空白
        .replace(/([()（）])\s+([()（）])/g, '$1$2')
        // 移除英文字母/數字與中文之間的空白
        .replace(/([a-zA-Z0-9])\s+([一-龥])/g, '$1$2')
        .replace(/([一-龥])\s+([a-zA-Z0-9])/g, '$1$2')
        // 移除連字號兩側的空白
        .replace(/\s+\-\s+/g, '-')
    }

    // 移除多個連續空白，替換為單一空白
    result = result.replace(/\s{2,}/g, ' ')
    
    // 移除行首行尾空白
    return result.trim()
  })

  // 過濾空行並合併
  return cleanedLines
    .filter(line => line.length > 0)
    .join('\n')
    .trim()
}

/**
 * 從圖片檔案中提取文字
 * @param {File|string} image - 圖片檔案或 URL
 * @param {object} options - 選項
 * @param {function} options.onProgress - 進度回呼函式 (progress: 0-1)
 * @param {string[]} options.languages - 語言列表，預設 ['chi_tra', 'eng']
 * @returns {Promise<object>} { text: string, confidence: number }
 */
export async function extractTextFromImage(image, options = {}) {
  const {
    onProgress = () => {},
    languages = ['chi_tra', 'eng'], // 繁體中文 + 英文
  } = options

  try {
    // 建立 worker
    const worker = await createWorker(languages, 1, {
      logger: (m) => {
        // 回報進度
        if (m.status === 'recognizing text') {
          onProgress(m.progress || 0)
        }
      },
    })

    // 執行 OCR
    const { data } = await worker.recognize(image)

    // 終止 worker
    await worker.terminate()

    // 清理辨識後的文字
    const cleanedText = cleanOCRText(data.text || '')

    return {
      text: cleanedText,
      rawText: data.text || '', // 保留原始文字供除錯用
      confidence: data.confidence || 0,
      success: true,
    }
  } catch (error) {
    console.error('OCR Error:', error)
    
    return {
      text: '',
      confidence: 0,
      success: false,
      error: error.message || '圖片辨識失敗',
    }
  }
}

/**
 * 驗證圖片檔案
 * @param {File} file - 圖片檔案
 * @returns {object} { valid: boolean, error?: string }
 */
export function validateImageFile(file) {
  // 檢查檔案類型
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支援的圖片格式，請上傳 JPG、PNG 或 WebP 格式',
    }
  }

  // 檢查檔案大小（限制 10MB）
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '圖片檔案過大，請上傳小於 10MB 的圖片',
    }
  }

  return { valid: true }
}

/**
 * 將圖片檔案轉為 Data URL
 * @param {File} file - 圖片檔案
 * @returns {Promise<string>} Data URL
 */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })
}

export default {
  extractTextFromImage,
  validateImageFile,
  fileToDataURL,
  cleanOCRText,
}

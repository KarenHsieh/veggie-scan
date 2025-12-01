/**
 * OCR 統一介面層
 * 根據環境變數選擇使用 Tesseract.js（客戶端）或 Cloud Vision API（伺服器端）
 */

import * as tesseractOCR from "./tesseract";

// 從環境變數讀取 OCR 引擎設定
// 支援值：'tesseract' | 'cloud-vision'
const OCR_ENGINE = process.env.NEXT_PUBLIC_OCR_ENGINE || "tesseract";

/**
 * 從圖片檔案中提取文字
 * 根據環境變數自動選擇 OCR 引擎
 *
 * @param {File|Buffer|string} image - 圖片檔案、Buffer 或 URL
 * @param {object} options - 選項
 * @param {function} options.onProgress - 進度回呼函式 (progress: 0-1)
 * @param {string[]} options.languages - 語言列表（僅 Tesseract 使用），預設 ['chi_tra', 'eng']
 * @returns {Promise<object>} { text: string, rawText: string, confidence: number, success: boolean }
 */
export async function extractTextFromImage(image, options = {}) {
  const engine = OCR_ENGINE.toLowerCase();
  const { onProgress = () => {} } = options;

  console.log(`[OCR] 使用引擎: ${engine}`);

  try {
    if (engine === "cloud-vision") {
      // Cloud Vision API 需要透過伺服器端 API 呼叫
      onProgress(0.1);

      const formData = new FormData();
      formData.append("image", image);

      onProgress(0.3);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      onProgress(0.8);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "OCR API 請求失敗");
      }

      const result = await response.json();
      onProgress(1);

      return result;
    } else {
      // 預設使用 Tesseract.js（客戶端執行）
      return await tesseractOCR.extractTextFromImage(image, options);
    }
  } catch (error) {
    console.error(`[OCR] ${engine} 引擎錯誤:`, error);

    return {
      text: "",
      rawText: "",
      confidence: 0,
      success: false,
      error: error.message || "圖片辨識失敗",
    };
  }
}

/**
 * 驗證圖片檔案
 * @param {File} file - 圖片檔案
 * @returns {object} { valid: boolean, error?: string }
 */
export function validateImageFile(file) {
  return tesseractOCR.validateImageFile(file);
}

/**
 * 將圖片檔案轉為 Data URL
 * @param {File} file - 圖片檔案
 * @returns {Promise<string>} Data URL
 */
export function fileToDataURL(file) {
  return tesseractOCR.fileToDataURL(file);
}

/**
 * 清理 OCR 辨識後的文字
 * @param {string} text - OCR 辨識的原始文字
 * @returns {string} 清理後的文字
 */
export function cleanOCRText(text) {
  return tesseractOCR.cleanOCRText(text);
}

/**
 * 取得目前使用的 OCR 引擎
 * @returns {string} 'tesseract' | 'cloud-vision'
 */
export function getOCREngine() {
  return OCR_ENGINE;
}

export default {
  extractTextFromImage,
  validateImageFile,
  fileToDataURL,
  cleanOCRText,
  getOCREngine,
};

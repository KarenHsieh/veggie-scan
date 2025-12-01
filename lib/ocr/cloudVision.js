/**
 * Google Cloud Vision API OCR 模組
 * 負責從圖片中提取文字
 */

import vision from "@google-cloud/vision";
import { cleanOCRText } from "./tesseract";

/**
 * 建立 Vision API Client
 * 支援多種憑證來源：
 * 1. GOOGLE_APPLICATION_CREDENTIALS 環境變數（檔案路徑）
 * 2. GOOGLE_CLOUD_CREDENTIALS_BASE64 環境變數（Base64 編碼的 JSON）
 * 3. GOOGLE_CLOUD_CREDENTIALS_JSON 環境變數（JSON 字串）
 */
function createVisionClient() {
  // 方法 1: 使用 Base64 編碼的憑證（適合 Zeabur 等平台）
  if (process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64) {
    try {
      const credentialsJson = Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64, "base64").toString("utf-8");
      const credentials = JSON.parse(credentialsJson);

      return new vision.ImageAnnotatorClient({
        credentials,
      });
    } catch (error) {
      console.error("Failed to parse GOOGLE_CLOUD_CREDENTIALS_BASE64:", error);
      throw new Error("無效的 Google Cloud 憑證（Base64）");
    }
  }

  // 方法 2: 使用 JSON 字串憑證
  if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS_JSON);

      return new vision.ImageAnnotatorClient({
        credentials,
      });
    } catch (error) {
      console.error("Failed to parse GOOGLE_CLOUD_CREDENTIALS_JSON:", error);
      throw new Error("無效的 Google Cloud 憑證（JSON）");
    }
  }

  // 方法 3: 使用預設的 GOOGLE_APPLICATION_CREDENTIALS（檔案路徑）
  // 這會自動從環境變數讀取檔案路徑
  return new vision.ImageAnnotatorClient();
}

/**
 * 從圖片檔案中提取文字（使用 Cloud Vision API）
 *
 * @param {File|Buffer|string} image - 圖片檔案、Buffer 或 base64 字串
 * @param {object} options - 選項
 * @param {function} options.onProgress - 進度回呼函式 (progress: 0-1)
 * @returns {Promise<object>} { text: string, rawText: string, confidence: number, success: boolean }
 */
export async function extractTextFromImage(image, options = {}) {
  const { onProgress = () => {} } = options;

  try {
    // 建立 Vision API client
    const client = createVisionClient();

    // 回報開始進度
    onProgress(0.3);

    let imageContent;

    // 處理不同類型的輸入
    if (typeof image === "string") {
      // Base64 或 URL
      if (image.startsWith("data:")) {
        // Data URL，提取 base64 部分
        const base64Data = image.split(",")[1];
        imageContent = Buffer.from(base64Data, "base64");
      } else if (image.startsWith("http")) {
        // URL（不建議在前端使用）
        imageContent = { source: { imageUri: image } };
      } else {
        // 純 base64
        imageContent = Buffer.from(image, "base64");
      }
    } else if (image instanceof Buffer) {
      // Buffer
      imageContent = image;
    } else if (image instanceof File || image instanceof Blob) {
      // File 或 Blob，轉換為 Buffer
      const arrayBuffer = await image.arrayBuffer();
      imageContent = Buffer.from(arrayBuffer);
    } else {
      throw new Error("不支援的圖片格式");
    }

    onProgress(0.5);

    // 執行文字偵測
    const [result] = await client.textDetection(imageContent);
    const detections = result.textAnnotations;

    onProgress(0.9);

    if (!detections || detections.length === 0) {
      return {
        text: "",
        rawText: "",
        confidence: 0,
        success: true,
        error: "未偵測到文字",
      };
    }

    // 第一個元素包含完整的文字
    const fullText = detections[0].description || "";

    // 計算平均信心度（如果有提供）
    let totalConfidence = 0;
    let confidenceCount = 0;

    detections.forEach((detection) => {
      if (detection.confidence !== undefined) {
        totalConfidence += detection.confidence;
        confidenceCount++;
      }
    });

    const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.95; // Cloud Vision 通常不提供 confidence，給予預設高信心度

    // 清理辨識後的文字
    const cleanedText = cleanOCRText(fullText);

    onProgress(1);

    return {
      text: cleanedText,
      rawText: fullText,
      confidence: averageConfidence,
      success: true,
    };
  } catch (error) {
    console.error("Cloud Vision OCR Error:", error);

    return {
      text: "",
      rawText: "",
      confidence: 0,
      success: false,
      error: error.message || "圖片辨識失敗",
    };
  }
}

export default {
  extractTextFromImage,
};

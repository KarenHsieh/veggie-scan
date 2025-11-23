import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = process.env.AI_FILTER_MODEL || "gemini-2.5-flash-lite";
const DEFAULT_TIMEOUT = parseInt(process.env.AI_FILTER_TIMEOUT_MS || "2500", 10);

function buildPrompt(ocrText) {
  return `任務：你會收到一段食品包裝 OCR 辨識結果。請只保留「疑似成分」的部分，
去除品名、重量、產地、公司、條碼、保存期限、客服電話等非成分資訊。

請輸出 JSON 結構如下：
{
  "ingredientsText": "...",
  "extracted": ["..."],
  "nonIngredientsExamples": ["..."]
}

不要加解釋，不要多餘文字。
輸入內容：
---
${ocrText}
---`;
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs))]);
}

function buildFallbackResult() {
  return {
    ingredientsText: "",
    extracted: [],
    nonIngredientsExamples: [],
    _fallback: true,
  };
}

export async function filterIngredientsWithGemini(ocrText, { locale = "zh" } = {}) {
  if (!ocrText || !ocrText.trim()) {
    return buildFallbackResult();
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.AI_FILTER_PROVIDER !== "gemini") {
    return buildFallbackResult();
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = buildPrompt(ocrText);

    const result = await withTimeout(model.generateContent(prompt), DEFAULT_TIMEOUT);

    const text = result?.response?.text?.();
    if (!text) return buildFallbackResult();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return buildFallbackResult();
    }

    return {
      ingredientsText: parsed.ingredientsText || "",
      extracted: Array.isArray(parsed.extracted) ? parsed.extracted : [],
      nonIngredientsExamples: Array.isArray(parsed.nonIngredientsExamples) ? parsed.nonIngredientsExamples : [],
      _fallback: !!parsed._fallback,
    };
  } catch (error) {
    // TODO: 日後可接 log 紀錄
    return buildFallbackResult();
  }
}

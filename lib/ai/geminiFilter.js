import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = process.env.AI_FILTER_MODEL || "gemini-2.5-flash-lite";
const DEFAULT_TIMEOUT = parseInt(process.env.AI_FILTER_TIMEOUT_MS || "2500", 10);

function buildPrompt(ocrText) {
  return `任務：你會收到一段食品包裝 OCR 辨識結果。請分析並提取「純成分名稱」。

規則：
1. extracted 陣列：只放入「純成分名稱」，例如：水、糖、小麥粉、乳化劑(E471)
2. 不要包含任何前綴文字，例如「品名：」、「成分：」、「原料：」等
3. nonIngredientsExamples 陣列：放入所有非成分資訊，包括：
   - 品名、產品名稱
   - 淨重、重量、容量
   - 保存期限、有效日期
   - 製造商、公司名稱、地址
   - 客服電話、條碼
   - 營養標示相關文字

範例輸入：
品名：某牌餅乾
成分：小麥粉、糖、棕櫚油
淨重：120g

正確輸出：
{
  "ingredientsText": "小麥粉、糖、棕櫚油",
  "extracted": ["小麥粉", "糖", "棕櫚油"],
  "nonIngredientsExamples": ["品名：某牌餅乾", "淨重：120g"]
}

錯誤輸出（不要這樣做）：
{
  "extracted": ["品名某牌餅乾", "成分小麥粉", "糖", "棕櫚油"]
}

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
    if (!text) {
      console.error("[Gemini Filter] No text in response");
      return buildFallbackResult();
    }

    console.log("[Gemini Filter] Raw response:", text);

    // 清理 Markdown code block 標記（```json ... ``` 或 ``` ... ```）
    let cleanedText = text.trim();

    // 移除開頭的 ```json 或 ``` (可能有換行)
    cleanedText = cleanedText.replace(/^```(?:json)?\s*/m, "");
    // 移除結尾的 ``` (可能有換行)
    cleanedText = cleanedText.replace(/\s*```\s*$/m, "");

    cleanedText = cleanedText.trim();

    console.log("[Gemini Filter] Cleaned text:", cleanedText);

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("[Gemini Filter] JSON parse error:", parseError.message);
      console.error("[Gemini Filter] Cleaned text:", cleanedText);
      return buildFallbackResult();
    }

    return {
      ingredientsText: parsed.ingredientsText || "",
      extracted: Array.isArray(parsed.extracted) ? parsed.extracted : [],
      nonIngredientsExamples: Array.isArray(parsed.nonIngredientsExamples) ? parsed.nonIngredientsExamples : [],
      _fallback: !!parsed._fallback,
    };
  } catch (error) {
    console.error("[Gemini Filter] Error:", error.message);
    return buildFallbackResult();
  }
}

/**
 * Gemini AI 成分判斷模組
 * 用於判斷資料庫中不存在的成分是否為素食可食用
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = process.env.AI_JUDGE_MODEL || "gemini-2.0-flash-exp";
const DEFAULT_TIMEOUT = parseInt(process.env.AI_JUDGE_TIMEOUT_MS || "3000", 10);

/**
 * 建立批次成分判斷的 Prompt
 * @param {string[]} ingredientNames - 成分名稱陣列
 * @param {string} locale - 語言代碼
 * @returns {string}
 */
function buildBatchJudgePrompt(ingredientNames, locale = "zh") {
  const ingredientList = ingredientNames.map((name, i) => `${i + 1}. ${name}`).join("\n");

  if (locale === "zh") {
    return `你是一位專業的食品成分分析師，專門判斷食品成分是否適合素食者食用。

請判斷以下 ${ingredientNames.length} 個成分：
${ingredientList}

判斷標準：
1. vegetarian（蛋奶素）：是否適合蛋奶素食者
   - false：含肉類、海鮮、動物油脂、明膠、葷食調味料（如沙茶、肉鬆、魚露）
   - true：植物來源、礦物質、蛋、奶製品

2. vegan（純素）：是否適合純素食者
   - false：含任何動物來源（包括蛋、奶、蜂蜜）
   - true：完全植物來源或礦物質

3. risk（風險等級）：
   - "low"：明確的植物來源（如玉米、小麥、大豆油）或礦物質（如鹽）
   - "medium"：可能有動物來源或需確認製程（如乳化劑、香料、調味料）
   - "high"：通常含動物成分（如奶精、起司粉）

4. reason：簡短說明判斷理由（15字以內）

重要原則：
- 明確的植物性食材（玉米、地瓜粉、花椒、大茴香等）→ vegetarian=true, vegan=true, risk="low"
- 明確的動物性食材（肉鬆、沙茶、魚露等）→ vegetarian=false, vegan=false, risk="high"
- 含乳製品（奶精、起司）→ vegetarian=true, vegan=false, risk="high"
- 來源不明的添加物（香料、調味料）→ risk="medium"

請以 JSON 陣列格式回覆（不要包含任何 Markdown 標記），陣列中每個物件對應一個成分：
[
  {
    "ingredient": "成分1",
    "vegetarian": true/false,
    "vegan": true/false,
    "risk": "low/medium/high",
    "reason": "判斷理由"
  },
  {
    "ingredient": "成分2",
    "vegetarian": true/false,
    "vegan": true/false,
    "risk": "low/medium/high",
    "reason": "判斷理由"
  }
]

範例：
輸入：
1. 肉鬆
2. 玉米
3. 花椒粉

輸出：
[
  {
    "ingredient": "肉鬆",
    "vegetarian": false,
    "vegan": false,
    "risk": "high",
    "reason": "含肉類，非素食"
  },
  {
    "ingredient": "玉米",
    "vegetarian": true,
    "vegan": true,
    "risk": "low",
    "reason": "植物來源，素食可食"
  },
  {
    "ingredient": "花椒粉",
    "vegetarian": true,
    "vegan": true,
    "risk": "low",
    "reason": "植物香料，素食可食"
  }
]`;
  }

  return `Analyze these ${ingredientNames.length} ingredients for vegetarian suitability:\n${ingredientList}`;
}

/**
 * 建立單個成分判斷的 Prompt（向後相容）
 * @param {string} ingredientName - 成分名稱
 * @param {string} locale - 語言代碼
 * @returns {string}
 */
function buildJudgePrompt(ingredientName, locale = "zh") {
  if (locale === "zh") {
    return `你是一位專業的食品成分分析師，專門判斷食品成分是否適合素食者食用。

請判斷以下成分：「${ingredientName}」

判斷標準：
1. vegetarian（蛋奶素）：是否適合蛋奶素食者
   - false：含肉類、海鮮、動物油脂、明膠、葷食調味料（如沙茶、肉鬆、魚露）
   - true：植物來源、礦物質、蛋、奶製品

2. vegan（純素）：是否適合純素食者
   - false：含任何動物來源（包括蛋、奶、蜂蜜）
   - true：完全植物來源或礦物質

3. risk（風險等級）：
   - "low"：明確的植物來源（如玉米、小麥、大豆油）或礦物質（如鹽）
   - "medium"：可能有動物來源或需確認製程（如乳化劑、香料、調味料）
   - "high"：通常含動物成分（如奶精、起司粉）

4. reason：簡短說明判斷理由（15字以內）

重要原則：
- 明確的植物性食材（玉米、地瓜粉、花椒、大茴香等）→ vegetarian=true, vegan=true, risk="low"
- 明確的動物性食材（肉鬆、沙茶、魚露等）→ vegetarian=false, vegan=false, risk="high"
- 含乳製品（奶精、起司）→ vegetarian=true, vegan=false, risk="high"
- 來源不明的添加物（香料、調味料）→ risk="medium"

請以 JSON 格式回覆，不要包含任何 Markdown 標記：
{
  "ingredient": "成分名稱",
  "vegetarian": true/false,
  "vegan": true/false,
  "risk": "low/medium/high",
  "reason": "判斷理由"
}

範例：
輸入：肉鬆
輸出：
{
  "ingredient": "肉鬆",
  "vegetarian": false,
  "vegan": false,
  "risk": "high",
  "reason": "含肉類，非素食"
}

輸入：玉米
輸出：
{
  "ingredient": "玉米",
  "vegetarian": true,
  "vegan": true,
  "risk": "low",
  "reason": "植物來源，素食可食"
}

輸入：奶精
輸出：
{
  "ingredient": "奶精",
  "vegetarian": true,
  "vegan": false,
  "risk": "high",
  "reason": "含乳製品，蛋奶素可食"
}

輸入：花椒粉
輸出：
{
  "ingredient": "花椒粉",
  "vegetarian": true,
  "vegan": true,
  "risk": "low",
  "reason": "植物香料，素食可食"
}

現在請判斷：「${ingredientName}」`;
  }

  // 英文版本（未來擴充）
  return `You are a professional food ingredient analyst specializing in determining whether ingredients are suitable for vegetarians.

Please analyze this ingredient: "${ingredientName}"

Criteria:
1. vegetarian: Suitable for lacto-ovo vegetarians (no meat/seafood, but may contain eggs/dairy)
2. vegan: Suitable for vegans (no animal-derived ingredients)
3. risk: Risk level ("low", "medium", "high")
4. reason: Brief explanation (under 50 characters)

Respond in JSON format without any Markdown:
{
  "ingredient": "ingredient name",
  "vegetarian": true/false,
  "vegan": true/false,
  "risk": "low/medium/high",
  "reason": "explanation"
}

Now analyze: "${ingredientName}"`;
}

/**
 * 為 Promise 加上超時機制
 */
function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("AI judge timeout")), timeoutMs)),
  ]);
}

/**
 * 建立 fallback 結果（當 AI 判斷失敗時）
 */
function buildFallbackResult(ingredientName) {
  return {
    ingredient: ingredientName,
    vegetarian: null,
    vegan: null,
    risk: "unknown",
    reason: "無法判斷，建議人工確認",
    _fallback: true,
  };
}

/**
 * 批次判斷多個成分是否為素食可食用
 * @param {string[]} ingredientNames - 成分名稱陣列
 * @param {object} options - 選項
 * @param {string} options.locale - 語言代碼
 * @returns {Promise<object[]>} 判斷結果陣列
 */
export async function judgeIngredientsWithGemini(ingredientNames, { locale = "zh" } = {}) {
  // 檢查輸入
  if (!Array.isArray(ingredientNames) || ingredientNames.length === 0) {
    return [];
  }

  // 過濾空值
  const validNames = ingredientNames.filter((name) => name && name.trim());
  if (validNames.length === 0) {
    return [];
  }

  // 檢查環境變數
  const apiKey = process.env.GEMINI_API_KEY;
  const provider = process.env.AI_JUDGE_PROVIDER || process.env.AI_FILTER_PROVIDER;

  if (!apiKey || provider !== "gemini") {
    console.log("[Gemini Judge] API key not found or provider not gemini, skip AI judge");
    return validNames.map((name) => buildFallbackResult(name));
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 20,
      },
    });

    const prompt = buildBatchJudgePrompt(validNames, locale);

    // 呼叫 API（加上超時控制）
    const result = await withTimeout(model.generateContent(prompt), DEFAULT_TIMEOUT);

    const response = result.response;
    let rawText = response.text();

    console.log("[Gemini Judge] Raw response:", rawText);

    // 清理 Markdown code block 標記
    rawText = rawText
      .replace(/^```(?:json)?\s*/gm, "")
      .replace(/```\s*$/gm, "")
      .trim();

    console.log("[Gemini Judge] Cleaned text:", rawText);

    // 解析 JSON
    const parsed = JSON.parse(rawText);

    // 驗證回應格式（應該是陣列）
    if (!Array.isArray(parsed)) {
      console.error("[Gemini Judge] Response is not an array:", parsed);
      return validNames.map((name) => buildFallbackResult(name));
    }

    // 驗證每個項目的必要欄位
    const results = parsed.map((item, index) => {
      if (typeof item.vegetarian !== "boolean" || typeof item.vegan !== "boolean" || !item.risk || !item.reason) {
        console.error("[Gemini Judge] Invalid item structure:", item);
        return buildFallbackResult(validNames[index]);
      }

      return {
        ...item,
        ingredient: item.ingredient || validNames[index],
        _fallback: false,
      };
    });

    return results;
  } catch (err) {
    console.error("[Gemini Judge] Error:", err.message || err);
    return validNames.map((name) => buildFallbackResult(name));
  }
}

/**
 * 使用 Gemini 判斷單個成分是否為素食可食用（向後相容）
 * @param {string} ingredientName - 成分名稱
 * @param {object} options - 選項
 * @param {string} options.locale - 語言代碼
 * @returns {Promise<object>} 判斷結果
 */
export async function judgeIngredientWithGemini(ingredientName, { locale = "zh" } = {}) {
  // 檢查輸入
  if (!ingredientName || !ingredientName.trim()) {
    return buildFallbackResult(ingredientName);
  }

  // 檢查環境變數
  const apiKey = process.env.GEMINI_API_KEY;
  const provider = process.env.AI_JUDGE_PROVIDER || process.env.AI_FILTER_PROVIDER;

  if (!apiKey || provider !== "gemini") {
    console.log("[Gemini Judge] API key not found or provider not gemini, skip AI judge");
    return buildFallbackResult(ingredientName);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      generationConfig: {
        temperature: 0.1, // 降低隨機性，提高判斷一致性
        topP: 0.8,
        topK: 20,
      },
    });

    const prompt = buildJudgePrompt(ingredientName, locale);

    // 呼叫 API（加上超時控制）
    const result = await withTimeout(model.generateContent(prompt), DEFAULT_TIMEOUT);

    const response = result.response;
    let rawText = response.text();

    console.log("[Gemini Judge] Raw response:", rawText);

    // 清理 Markdown code block 標記
    rawText = rawText
      .replace(/^```(?:json)?\s*/gm, "")
      .replace(/```\s*$/gm, "")
      .trim();

    console.log("[Gemini Judge] Cleaned text:", rawText);

    // 解析 JSON
    const parsed = JSON.parse(rawText);

    // 驗證必要欄位
    if (typeof parsed.vegetarian !== "boolean" || typeof parsed.vegan !== "boolean" || !parsed.risk || !parsed.reason) {
      console.error("[Gemini Judge] Invalid response structure:", parsed);
      return buildFallbackResult(ingredientName);
    }

    return {
      ...parsed,
      ingredient: ingredientName, // 確保使用原始輸入的成分名稱
      _fallback: false,
    };
  } catch (err) {
    console.error("[Gemini Judge] Error:", err.message || err);
    return buildFallbackResult(ingredientName);
  }
}

export default {
  judgeIngredientsWithGemini,
  judgeIngredientWithGemini,
};

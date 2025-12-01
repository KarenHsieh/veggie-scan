import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = process.env.AI_FILTER_MODEL || "gemini-2.5-flash-lite";
const DEFAULT_TIMEOUT = parseInt(process.env.AI_FILTER_TIMEOUT_MS || "5000", 10);

function buildPrompt(ocrText, locale = "zh") {
  if (locale === "zh") {
    return `你是一位專業的食品標籤分析師。請從以下 OCR 辨識結果中，只提取「食品成分」部分。

OCR 辨識結果：
${ocrText}

任務說明：
1. 只保留「成分」或「原料」欄位中列出的實際成分名稱
2. **拆分複合成分**：
   - 如果括號內包含多個成分（用逗號、頓號分隔），請拆分成個別成分
   - 例如：「調味料(蔗糖、鹽、香料)」→ 拆成「蔗糖」、「鹽」、「香料」
   - 例外：說明性括號保留，如「玉米(非基因改造)」→ 保留為「玉米(非基因改造)」
3. 清理成分名稱：
   - 移除多餘的標點符號（如：「大豆油)」→「大豆油」）
   - 修正不成對的括號（如：「甜味劑(蔗糖素」→「甜味劑(蔗糖素)」或「蔗糖素」）
   - 修正 OCR 常見錯誤：
     * 「海答」→「海苔」
     * 「榨欄油」→「棕櫚油」
     * 「樹昔澱粉」→「樹薯澱粉」
     * 「辣板紅」→「辣椒紅」
     * 「維生素日」→「維生素E」
     * 「l-」→「L-」（小寫改大寫）
     * 「dl-」→「DL-」（小寫改大寫）
   - 修正化學成分名稱中的錯字（如：「嚎吟」→「嘌呤」、「意」→「苷」）
4. **嚴格移除所有非成分資訊**，包括：
   - 商品資訊：品名、商品名稱、產品名稱、商品資訊
   - 重量資訊：重量、淨重、容量、內容量（如：10公克X12包）、本包裝含、每份
   - 日期資訊：有效日期、保存期限、製造日期、西元年/月/日
   - 廠商資訊：製造商、公司、廠商、地址、電話、客服
   - 保存說明：保存方式、保存方法、請保存、避免、開封後、密封、儘早食用、拆包後請儘速食用完畢
   - 產地資訊：原產地、產地、製造地、台灣、日本、青森縣等地名
   - 過敏原資訊：過敏原、過敏者、應避免食用、含有
   - 營養標示：營養標示、每一份量、熱量、蛋白質、脂肪、碳水化合物、糖、鈉、大卡、公克、毫克
   - 使用說明：使用方法、直接食用、注意事項、請勿食用
   - 包裝說明：內附脫氧劑、內容物
   - 無意義片段：單個字母、單個數字、標點符號、「食」、「類」等單字
   - 條碼、批號、序號

重要：
- 不要包含「成分：」、「原料：」等前綴字
- 不要包含任何說明性文字或營養標示
- 只提取純粹的成分名稱
- 每個成分應該是獨立的食材或添加物

請以 JSON 格式回覆（不要包含 Markdown 標記）：
{
  "ingredientsText": "成分1、成分2、成分3",
  "extracted": ["成分1", "成分2", "成分3"],
  "nonIngredientsExamples": ["品名：XXX", "重量：XXX", "保存方式：XXX"]
}

範例 1（簡單成分）：
輸入：品名：某牌餅乾\n成分：小麥粉、糖、棕櫚油、乳化劑(E471)、香料、鹽\n淨重：120g\n保存方式：請保存在陰涼乾燥處
輸出：
{
  "ingredientsText": "小麥粉、糖、棕櫚油、乳化劑(E471)、香料、鹽",
  "extracted": ["小麥粉", "糖", "棕櫚油", "乳化劑(E471)", "香料", "鹽"],
  "nonIngredientsExamples": ["品名：某牌餅乾", "淨重：120g", "保存方式：請保存在陰涼乾燥處"]
}

範例 2（複合成分需拆分）：
輸入：成分：玉米(非基因改造)、調味料(蔗糖、鹽、香料、辣椒)、大豆油)\n重量：10公克X12包
輸出：
{
  "ingredientsText": "玉米(非基因改造)、蔗糖、鹽、香料、辣椒、大豆油",
  "extracted": ["玉米(非基因改造)", "蔗糖", "鹽", "香料", "辣椒", "大豆油"],
  "nonIngredientsExamples": ["重量：10公克X12包"]
}

範例 3（OCR 錯誤修正與括號處理）：
輸入：成分:海答、芥花油、泡菜粉(徐、麥芽糊精、調味劑(檸檬酸、l-麩酸鈉)、辣板紅)、抗氧化劑(維生素日
輸出：
{
  "ingredientsText": "海苔、芥花油、糖、麥芽糊精、檸檬酸、L-麩酸鈉、辣椒紅、抗氧化劑(維生素E)",
  "extracted": ["海苔", "芥花油", "糖", "麥芽糊精", "檸檬酸", "L-麩酸鈉", "辣椒紅", "抗氧化劑(維生素E)"],
  "nonIngredientsExamples": []
}`;
  }
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
    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      generationConfig: {
        temperature: 0.1, // 降低隨機性，提高穩定性
        topP: 0.8,
        topK: 20,
      },
    });

    const prompt = buildPrompt(ocrText, locale);

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

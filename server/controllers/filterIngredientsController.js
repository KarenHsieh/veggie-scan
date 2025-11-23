import { filterIngredientsWithGemini } from "../../lib/ai/geminiFilter";

// 規則式 fallback：簡單版，之後可依 stopwords 擴充
function ruleBasedFilter(ocrText) {
  if (!ocrText || !ocrText.trim()) {
    return {
      ingredientsText: "",
      extracted: [],
      nonIngredientsExamples: [],
      _fallback: true,
    };
  }

  const lines = ocrText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const nonIngredientKeywords = ["公司", "股份", "電話", "客服", "地址", "製造", "出品", "淨重", "保存期限"];

  const ingredientLines = [];
  const nonIngredientsExamples = [];

  for (const line of lines) {
    if (nonIngredientKeywords.some((kw) => line.includes(kw))) {
      nonIngredientsExamples.push(line);
    } else {
      ingredientLines.push(line);
    }
  }

  const ingredientsText = ingredientLines.join("\n");

  return {
    ingredientsText,
    extracted: ingredientsText ? ingredientLines : [],
    nonIngredientsExamples,
    _fallback: true,
  };
}

export async function postFilterIngredients(req) {
  const body = await req.json();
  const { ocrText, locale = "zh" } = body || {};

  // 先嘗試 AI 過濾
  const aiResult = await filterIngredientsWithGemini(ocrText, { locale });

  if (!aiResult || aiResult._fallback) {
    const ruleResult = ruleBasedFilter(ocrText || "");
    return Response.json(ruleResult, { status: 200 });
  }

  return Response.json(
    {
      ingredientsText: aiResult.ingredientsText || "",
      extracted: aiResult.extracted || [],
      nonIngredientsExamples: aiResult.nonIngredientsExamples || [],
      _fallback: !!aiResult._fallback,
    },
    { status: 200 }
  );
}

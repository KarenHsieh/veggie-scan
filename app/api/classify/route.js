import { NextResponse } from "next/server";
import { normalizeIngredients } from "../../../lib/text/normalize.js";
import { tokenizeWithECodes } from "../../../lib/text/tokenize.js";
import { classify, getFinalVerdict } from "../../../lib/rules/classify.js";
import { explain, generateSummaryText } from "../../../lib/rules/explain.js";
import { judgeIngredientsWithGemini } from "../../../lib/ai/geminiJudge.js";
import { getCachedJudge, setCachedJudge } from "../../../lib/storage/aiJudgeCache.js";

/**
 * 根據 AI 判斷結果決定成分狀態
 * @param {object} judgeResult - AI 判斷結果
 * @returns {string} 'safe' | 'warning' | 'danger'
 */
function determineStatusFromAI(judgeResult) {
  // 非素食 -> danger
  if (judgeResult.vegetarian === false) {
    return "danger";
  }

  // 蛋奶素可食但非純素，或風險為 medium/high -> warning
  if (!judgeResult.vegan || judgeResult.risk === "medium" || judgeResult.risk === "high") {
    return "warning";
  }

  // 純素且低風險 -> safe
  return "safe";
}

/**
 * POST /api/classify
 * 接收成分文字，回傳分類結果
 *
 * Request Body:
 * {
 *   "text": "水、糖、小麥粉、乳化劑(E471)"
 * }
 *
 * Response:
 * {
 *   "status": "ok",
 *   "verdict": "warning",
 *   "summary": "⚠️ 有 1 項成分需要確認來源",
 *   "explanation": { ... }
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { text } = body;

    // 驗證輸入
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        {
          status: "error",
          message: "請提供有效的成分文字",
        },
        { status: 400 }
      );
    }

    // 1. 標準化文字
    const normalized = normalizeIngredients(text);

    // 2. 分詞與提取 E-codes
    const tokenData = tokenizeWithECodes(normalized);

    // 3. 分類判斷
    const classifyResults = classify(tokenData);

    // 3.5. AI 判斷強化：對 unknown 成分使用 AI 批次判斷
    const AI_JUDGE_ENABLED = process.env.NEXT_PUBLIC_AI_JUDGE_ENABLED === "true";

    if (AI_JUDGE_ENABLED && classifyResults.unknown.length > 0) {
      console.log(
        `[Classify API] Found ${classifyResults.unknown.length} unknown ingredients, using AI batch judge...`
      );

      // 收集需要 AI 判斷的成分（先檢查暫存）
      const needAIJudge = [];
      const cachedResults = new Map();

      for (const unknownItem of classifyResults.unknown) {
        const ingredientName = unknownItem.input;
        const cached = getCachedJudge(ingredientName);

        if (cached) {
          console.log(`[Classify API] Using cached judge for: ${ingredientName}`);
          cachedResults.set(ingredientName, cached);
        } else {
          needAIJudge.push(ingredientName);
        }
      }

      // 批次呼叫 AI 判斷（一次處理所有未暫存的成分）
      let batchResults = [];
      if (needAIJudge.length > 0) {
        console.log(`[Classify API] Calling AI batch judge for ${needAIJudge.length} ingredients:`, needAIJudge);
        batchResults = await judgeIngredientsWithGemini(needAIJudge, { locale: "zh" });

        // 將批次結果存入暫存
        batchResults.forEach((result) => {
          if (!result._fallback) {
            setCachedJudge(result.ingredient, result);
          }
        });
      }

      // 合併暫存結果和新判斷結果
      const allResults = new Map();
      cachedResults.forEach((result, name) => allResults.set(name, result));
      batchResults.forEach((result) => allResults.set(result.ingredient, result));

      // 根據 AI 判斷結果重新分類
      const aiJudgedItems = [];

      for (const unknownItem of classifyResults.unknown) {
        const ingredientName = unknownItem.input;
        const judgeResult = allResults.get(ingredientName);

        if (judgeResult && !judgeResult._fallback && judgeResult.vegetarian !== null) {
          const status = determineStatusFromAI(judgeResult);
          const aiItem = {
            input: ingredientName,
            matched: true,
            matchType: "ai",
            confidence: 0.8,
            item: {
              name: ingredientName,
              displayName: ingredientName,
              vegetarian: judgeResult.vegetarian,
              vegan: judgeResult.vegan,
              risk: judgeResult.risk,
              reason: judgeResult.reason,
              source: "ai",
              category: "AI判斷",
            },
          };

          classifyResults[status].push(aiItem);
          aiJudgedItems.push(ingredientName);
        }
      }

      // 從 unknown 中移除已被 AI 判斷的項目
      classifyResults.unknown = classifyResults.unknown.filter((item) => !aiJudgedItems.includes(item.input));

      console.log(
        `[Classify API] AI judged ${aiJudgedItems.length} ingredients (${cachedResults.size} from cache, ${batchResults.length} from API)`
      );
    }

    // 4. 取得最終判斷
    const finalVerdict = getFinalVerdict(classifyResults);

    // 5. 生成解釋
    const explanation = explain(classifyResults, finalVerdict);

    // 6. 生成摘要
    const summary = generateSummaryText(explanation);

    // 回傳結果
    return NextResponse.json({
      status: "ok",
      verdict: finalVerdict,
      summary: summary,
      explanation: explanation,
      debug: {
        normalized: normalized,
        tokens: tokenData.tokens,
        eCodes: tokenData.eCodes,
      },
    });
  } catch (error) {
    console.error("Classify API Error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "處理失敗，請稍後再試",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/classify
 * 測試用端點
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Classify API is running",
    usage: 'POST with { "text": "your ingredients text" }',
  });
}

import { NextResponse } from 'next/server'
import { normalizeIngredients } from '../../../lib/text/normalize.js'
import { tokenizeWithECodes } from '../../../lib/text/tokenize.js'
import { classify, getFinalVerdict } from '../../../lib/rules/classify.js'
import { explain, generateSummaryText } from '../../../lib/rules/explain.js'

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
    const body = await request.json()
    const { text } = body

    // 驗證輸入
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        {
          status: 'error',
          message: '請提供有效的成分文字',
        },
        { status: 400 }
      )
    }

    // 1. 標準化文字
    const normalized = normalizeIngredients(text)

    // 2. 分詞與提取 E-codes
    const tokenData = tokenizeWithECodes(normalized)

    // 3. 分類判斷
    const classifyResults = classify(tokenData)

    // 4. 取得最終判斷
    const finalVerdict = getFinalVerdict(classifyResults)

    // 5. 生成解釋
    const explanation = explain(classifyResults, finalVerdict)

    // 6. 生成摘要
    const summary = generateSummaryText(explanation)

    // 回傳結果
    return NextResponse.json({
      status: 'ok',
      verdict: finalVerdict,
      summary: summary,
      explanation: explanation,
      debug: {
        normalized: normalized,
        tokens: tokenData.tokens,
        eCodes: tokenData.eCodes,
      },
    })
  } catch (error) {
    console.error('Classify API Error:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        message: '處理失敗，請稍後再試',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/classify
 * 測試用端點
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Classify API is running',
    usage: 'POST with { "text": "your ingredients text" }',
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { parseLabel } from '@/lib/parser'
import { classifyIngredients } from '@/lib/classifier'
import { computeVerdict } from '@/lib/verdict'
import { checkRateLimit, buildRateLimitResponse } from '@/lib/rate-limit'
import type { VegetarianType } from '@/types/ingredients'

const VALID_DIET_TYPES: VegetarianType[] = [
  'vegan', 'egg', 'lacto', 'lacto-ovo', 'five-pungent',
]

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request)
  if (!rateLimitResult.ok) {
    return buildRateLimitResponse(rateLimitResult.retryAfter)
  }

  try {
    const body = await request.json()
    const { text, dietType = 'vegan' } = body

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: '請提供成分文字' },
        { status: 400 }
      )
    }

    if (!VALID_DIET_TYPES.includes(dietType)) {
      return NextResponse.json(
        { error: '無效的素食類型' },
        { status: 400 }
      )
    }

    // Pipeline: parse (ingredients + notices) → classify → verdict
    const { ingredients: parsed, notices } = await parseLabel(text.trim())
    const classified = await classifyIngredients(parsed)
    const verdict = computeVerdict(classified, dietType)

    return NextResponse.json({ ingredients: classified, verdict, notices })
  } catch (error) {
    console.error('Analysis error:', error)

    const message = error instanceof Error ? error.message : '成分分析失敗，請重試'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

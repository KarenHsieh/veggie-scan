import { NextRequest, NextResponse } from 'next/server'
import { parseIngredients } from '@/lib/parser'
import { checkRateLimit, buildRateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request)
  if (!rateLimitResult.ok) {
    return buildRateLimitResponse(rateLimitResult.retryAfter)
  }

  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: '請提供成分文字' },
        { status: 400 }
      )
    }

    const ingredients = await parseIngredients(text.trim())

    return NextResponse.json({ ingredients })
  } catch (error) {
    console.error('Parse error:', error)

    const message = error instanceof Error ? error.message : '成分解析失敗，請重試'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

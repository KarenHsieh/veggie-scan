import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromImage } from '@/lib/ocr'
import { checkRateLimit, buildRateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request)
  if (!rateLimitResult.ok) {
    return buildRateLimitResponse(rateLimitResult.retryAfter)
  }

  try {
    const body = await request.json()
    const { image } = body

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: '請提供圖片資料（base64 格式）' },
        { status: 400 }
      )
    }

    const text = await extractTextFromImage(image)

    return NextResponse.json({ text })
  } catch (error) {
    console.error('OCR extraction error:', error)

    const message = error instanceof Error ? error.message : 'OCR 辨識失敗，請重試'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

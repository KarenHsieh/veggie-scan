import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  buildRateLimitResponse,
  resolveClientIp,
  FEEDBACK_BUCKET,
  FEEDBACK_MAX_REQUESTS,
} from '@/lib/rate-limit'
import {
  sendFeedbackEmail,
  FeedbackEmailConfigError,
  FeedbackEmailSendError,
} from '@/lib/feedback-email'
import type {
  ClassifiedIngredient,
  FeedbackPayload,
  IngredientCategory,
  VegetarianType,
} from '@/types/ingredients'

const VALID_CATEGORIES: ReadonlySet<IngredientCategory> = new Set([
  'non-vegetarian',
  'five-pungent',
  'egg',
  'dairy',
  'ambiguous',
  'vegetarian',
])

const VALID_DIET_TYPES: ReadonlySet<VegetarianType> = new Set([
  'vegan',
  'egg',
  'lacto',
  'lacto-ovo',
  'five-pungent',
])

const VALID_SOURCES: ReadonlySet<ClassifiedIngredient['source']> = new Set([
  'database',
  'ai',
])

const MAX_PAYLOAD_BYTES = 30 * 1024
const MAX_USER_NOTE_LENGTH = 1000

type ValidationResult =
  | { ok: true; payload: FeedbackPayload }
  | { ok: false; status: number; error: string; message: string }

function invalid(message: string): ValidationResult {
  return { ok: false, status: 400, error: 'invalid_payload', message }
}

function isClassifiedIngredient(value: unknown): value is ClassifiedIngredient {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.originalText === 'string' &&
    typeof v.normalizedName === 'string' &&
    typeof v.description === 'string' &&
    typeof v.category === 'string' &&
    VALID_CATEGORIES.has(v.category as IngredientCategory) &&
    typeof v.source === 'string' &&
    VALID_SOURCES.has(v.source as ClassifiedIngredient['source'])
  )
}

function validatePayload(raw: unknown, rawSize: number): ValidationResult {
  if (rawSize > MAX_PAYLOAD_BYTES) {
    return { ok: false, status: 400, error: 'payload_too_large', message: '回報內容過大' }
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return invalid('payload must be a JSON object')
  }

  const body = raw as Record<string, unknown>

  if (!Array.isArray(body.ingredients)) {
    return invalid('ingredients is required and must be an array')
  }
  if (body.ingredients.length === 0) {
    return invalid('ingredients must not be empty')
  }
  for (let i = 0; i < body.ingredients.length; i++) {
    if (!isClassifiedIngredient(body.ingredients[i])) {
      return invalid(`ingredients[${i}] has invalid shape`)
    }
  }
  const ingredients = body.ingredients as ClassifiedIngredient[]

  if (!Array.isArray(body.flaggedIndices)) {
    return invalid('flaggedIndices is required and must be an array')
  }
  for (const idx of body.flaggedIndices) {
    if (!Number.isInteger(idx) || (idx as number) < 0 || (idx as number) >= ingredients.length) {
      return invalid('flaggedIndices contains an out-of-range or non-integer value')
    }
  }
  const flaggedIndices = body.flaggedIndices as number[]

  if (typeof body.dietType !== 'string' || !VALID_DIET_TYPES.has(body.dietType as VegetarianType)) {
    return invalid('dietType is required and must be a valid VegetarianType')
  }
  const dietType = body.dietType as VegetarianType

  let userNote: string | undefined
  if (body.userNote !== undefined) {
    if (typeof body.userNote !== 'string') {
      return invalid('userNote must be a string')
    }
    if (body.userNote.length > MAX_USER_NOTE_LENGTH) {
      return invalid(`userNote exceeds ${MAX_USER_NOTE_LENGTH} characters`)
    }
    userNote = body.userNote
  }

  let suggestedCategory: IngredientCategory | undefined
  if (body.suggestedCategory !== undefined) {
    if (
      typeof body.suggestedCategory !== 'string' ||
      !VALID_CATEGORIES.has(body.suggestedCategory as IngredientCategory)
    ) {
      return invalid('suggestedCategory must be a valid IngredientCategory')
    }
    suggestedCategory = body.suggestedCategory as IngredientCategory
  }

  if (flaggedIndices.length === 0 && (!userNote || userNote.trim().length === 0)) {
    return {
      ok: false,
      status: 400,
      error: 'empty_feedback',
      message: '請至少勾選一個成分或填寫補充說明',
    }
  }

  return {
    ok: true,
    payload: { ingredients, flaggedIndices, dietType, userNote, suggestedCategory },
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, {
    bucket: FEEDBACK_BUCKET,
    maxRequests: FEEDBACK_MAX_REQUESTS,
  })
  if (!rateLimitResult.ok) {
    return buildRateLimitResponse(rateLimitResult.retryAfter)
  }

  let rawText: string
  try {
    rawText = await request.text()
  } catch {
    return NextResponse.json(
      { error: 'invalid_payload', message: '無法讀取請求內容' },
      { status: 400 }
    )
  }

  const rawSize = new TextEncoder().encode(rawText).byteLength

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    return NextResponse.json(
      { error: 'invalid_payload', message: '請求內容不是合法的 JSON' },
      { status: 400 }
    )
  }

  const validation = validatePayload(parsed, rawSize)
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error, message: validation.message },
      { status: validation.status }
    )
  }

  try {
    await sendFeedbackEmail({
      ...validation.payload,
      clientIp: resolveClientIp(request),
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof FeedbackEmailConfigError) {
      return NextResponse.json(
        { error: 'feedback_failed', message: '回報服務暫時無法使用，請稍後再試' },
        { status: 500 }
      )
    }
    if (error instanceof FeedbackEmailSendError) {
      return NextResponse.json(
        { error: 'feedback_failed', message: '回報寄送失敗，請稍後再試' },
        { status: 500 }
      )
    }
    console.error('[feedback] Unexpected error:', error)
    return NextResponse.json(
      { error: 'feedback_failed', message: '回報寄送失敗，請稍後再試' },
      { status: 500 }
    )
  }
}

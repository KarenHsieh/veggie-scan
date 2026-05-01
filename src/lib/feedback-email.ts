import crypto from 'node:crypto'
import { Resend } from 'resend'
import type {
  ClassifiedIngredient,
  IngredientCategory,
  VegetarianType,
} from '@/types/ingredients'

const DEFAULT_RECIPIENT = 'mooshi21824@gmail.com'
const DEFAULT_SENDER = 'onboarding@resend.dev'

const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  'non-vegetarian': '不可食用（動物性）',
  'five-pungent': '五辛',
  egg: '蛋',
  dairy: '奶',
  ambiguous: '無法確定',
  vegetarian: '全素',
}

const DIET_LABEL: Record<VegetarianType, string> = {
  vegan: '全素',
  egg: '蛋素',
  lacto: '奶素',
  'lacto-ovo': '蛋奶素',
  'five-pungent': '五辛素',
}

const SOURCE_LABEL: Record<ClassifiedIngredient['source'], string> = {
  database: '資料庫',
  ai: 'AI',
}

export interface SendFeedbackEmailInput {
  ingredients: ClassifiedIngredient[]
  flaggedIndices: number[]
  dietType: VegetarianType
  userNote?: string
  suggestedCategory?: IngredientCategory
  clientIp: string
}

function ipFingerprint(ip: string): string {
  const hash = crypto.createHash('sha256').update(ip).digest('hex')
  return `IP#${hash.slice(0, 8)}`
}

function timestampTaipei(now: Date = new Date()): string {
  // ISO 8601 in Asia/Taipei. Intl returns parts; rebuild as YYYY-MM-DDTHH:MM:SS+08:00.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}+08:00`
}

function formatIngredientLine(item: ClassifiedIngredient, index: number): string {
  const name = item.originalText
  const normalized =
    item.normalizedName && item.normalizedName !== item.originalText
      ? ` (${item.normalizedName})`
      : ''
  const category = CATEGORY_LABEL[item.category] ?? item.category
  const source = SOURCE_LABEL[item.source] ?? item.source
  return `  ${index + 1}. ${name}${normalized} — ${category} [${source}]`
}

export function buildEmailBody(input: SendFeedbackEmailInput): string {
  const flaggedSet = new Set(input.flaggedIndices)
  const flaggedItems = input.ingredients
    .map((item, idx) => ({ item, idx }))
    .filter(({ idx }) => flaggedSet.has(idx))

  const lines: string[] = []
  lines.push(`送出時間：${timestampTaipei()}`)
  lines.push(`來源識別：${ipFingerprint(input.clientIp)}`)
  lines.push(`素食類型：${DIET_LABEL[input.dietType]} (${input.dietType})`)
  lines.push('')

  lines.push('已勾選成分：')
  if (flaggedItems.length === 0) {
    lines.push('  （無，僅補充說明）')
  } else {
    for (const { item, idx } of flaggedItems) {
      lines.push(formatIngredientLine(item, idx))
    }
  }
  lines.push('')

  if (input.suggestedCategory) {
    const label = CATEGORY_LABEL[input.suggestedCategory] ?? input.suggestedCategory
    lines.push(`建議分類：${label} (${input.suggestedCategory})`)
    lines.push('')
  }

  if (input.userNote && input.userNote.trim().length > 0) {
    lines.push('補充說明：')
    lines.push(input.userNote.trim())
    lines.push('')
  }

  lines.push('完整成分清單：')
  for (let i = 0; i < input.ingredients.length; i++) {
    lines.push(formatIngredientLine(input.ingredients[i], i))
  }

  return lines.join('\n')
}

function getRecipient(): string {
  const configured = process.env.FEEDBACK_RECIPIENT_EMAIL?.trim()
  if (configured) return configured
  console.warn(
    '[feedback-email] FEEDBACK_RECIPIENT_EMAIL is not set; using default recipient.'
  )
  return DEFAULT_RECIPIENT
}

export class FeedbackEmailConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FeedbackEmailConfigError'
  }
}

export class FeedbackEmailSendError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FeedbackEmailSendError'
  }
}

export async function sendFeedbackEmail(input: SendFeedbackEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    console.error(
      '[feedback-email] RESEND_API_KEY is not set; cannot send feedback email.'
    )
    throw new FeedbackEmailConfigError('RESEND_API_KEY is not configured')
  }

  const resend = new Resend(apiKey)
  const recipient = getRecipient()
  const flaggedCount = input.flaggedIndices.length
  const subject =
    flaggedCount > 0
      ? `[VeggieScan] 成分回報 (${flaggedCount} 筆)`
      : '[VeggieScan] 成分回報 (補充說明)'

  const body = buildEmailBody(input)

  const result = await resend.emails.send({
    from: DEFAULT_SENDER,
    to: recipient,
    subject,
    text: body,
  })

  if (result.error) {
    console.error(
      '[feedback-email] Resend API returned an error:',
      result.error.message ?? result.error
    )
    throw new FeedbackEmailSendError(result.error.message ?? 'Resend send failed')
  }
}

import { model } from './gemini'
import type { Notice, NoticeType, ParsedIngredient } from '@/types/ingredients'

const VALID_NOTICE_TYPES: ReadonlySet<NoticeType> = new Set([
  'allergen',
  'storage',
  'expiration',
  'other',
])

const PARSE_PROMPT = `You are a food packaging label parser. Given raw text from a food packaging label, extract two structured outputs in a SINGLE JSON response: ingredients and notices.

# Ingredient extraction (rules)
1. Filter out marketing text, nutritional facts, manufacturing details, and barcode numbers — discard entirely.
2. Split compound ingredients enclosed in parentheses/brackets into individual items (e.g., "調味料（蔗糖、鹽）" → extract 蔗糖 and 鹽 separately).
3. Handle nested parentheses (e.g., "巧克力（可可粉、糖、乳化劑（大豆卵磷脂））").
4. Merge broken lines and normalize whitespace within ingredient names.
5. For Japanese ingredient names, provide the Chinese or English equivalent as normalizedName.
6. For Chinese/English ingredients, normalizedName should be the cleaned version of the original.

# Notice extraction (rules)
Notices are consumer-facing statements that are NOT ingredients but ARE useful to the consumer. Capture them in their ORIGINAL language verbatim — do not translate, paraphrase, or restructure. Classify each into one of four types:
- "allergen": allergen warnings (e.g., "本產品含有牛奶、雞蛋", "可能含有微量花生", "Contains: peanuts")
- "storage": storage / handling instructions (e.g., "請冷藏保存於 7°C 以下", "避免高溫直射日光")
- "expiration": expiration / best-before dates (e.g., "賞味期限：2026.12.31", "Best before 2027/01/15")
- "other": other consumer warnings or post-opening guidance (e.g., "開封後請盡早食用", "嬰幼兒不宜")

If a statement does not fit allergen/storage/expiration, classify as "other" rather than dropping it.
Do NOT include nutritional facts, marketing, or manufacturer info as notices.

# Output format
Output ONLY a single JSON object (no markdown, no commentary). Schema:
{
  "ingredients": [{"originalText": "...", "normalizedName": "..."}, ...],
  "notices": [{"type": "allergen|storage|expiration|other", "text": "..."}, ...]
}

If no notices exist, return "notices": [].

Example:
Input:
原料：砂糖、麵粉、鮮奶
過敏原：本產品含有牛奶
賞味期限：2026.12.31

Output:
{
  "ingredients": [
    {"originalText": "砂糖", "normalizedName": "砂糖"},
    {"originalText": "麵粉", "normalizedName": "麵粉"},
    {"originalText": "鮮奶", "normalizedName": "鮮奶"}
  ],
  "notices": [
    {"type": "allergen", "text": "本產品含有牛奶"},
    {"type": "expiration", "text": "2026.12.31"}
  ]
}`

export interface ParseLabelResult {
  ingredients: ParsedIngredient[]
  notices: Notice[]
}

interface RawNotice {
  type?: unknown
  text?: unknown
}

function isParsedIngredient(value: unknown): value is ParsedIngredient {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.originalText === 'string' && typeof v.normalizedName === 'string'
}

function sanitizeNotices(raw: unknown): Notice[] {
  if (!Array.isArray(raw)) {
    if (raw !== undefined) {
      console.warn('[parser] notices field is not an array; falling back to empty array.')
    }
    return []
  }

  const result: Notice[] = []
  for (const entry of raw as RawNotice[]) {
    if (typeof entry !== 'object' || entry === null) {
      console.warn('[parser] dropping malformed notice entry (not an object):', entry)
      continue
    }
    if (typeof entry.text !== 'string' || entry.text.trim().length === 0) {
      console.warn('[parser] dropping malformed notice entry (missing text):', entry)
      continue
    }
    const text = entry.text.trim()
    let type: NoticeType
    if (typeof entry.type === 'string' && VALID_NOTICE_TYPES.has(entry.type as NoticeType)) {
      type = entry.type as NoticeType
    } else if (typeof entry.type === 'string') {
      console.warn(
        `[parser] downgrading unknown notice type "${entry.type}" to "other".`
      )
      type = 'other'
    } else {
      console.warn('[parser] dropping notice entry with missing or non-string type:', entry)
      continue
    }
    result.push({ type, text })
  }
  return result
}

function extractJsonObject(text: string): string | null {
  // Match the first balanced {...} object in the response.
  // Gemini may wrap output in ```json fences, prose, etc.
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : null
}

export async function parseLabel(rawText: string): Promise<ParseLabelResult> {
  const result = await model.generateContent([
    PARSE_PROMPT,
    `Raw label text:\n${rawText}`,
  ])

  const text = result.response.text().trim()
  const jsonString = extractJsonObject(text)
  if (!jsonString) {
    throw new Error('AI 無法解析成分資料，請重新輸入')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error('AI 回傳的成分資料格式不正確')
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('AI 回傳的成分資料格式不正確')
  }

  const obj = parsed as Record<string, unknown>

  if (!Array.isArray(obj.ingredients)) {
    throw new Error('AI 回傳的成分資料格式不正確')
  }
  for (const item of obj.ingredients) {
    if (!isParsedIngredient(item)) {
      throw new Error('AI 回傳的成分資料格式不正確')
    }
  }

  return {
    ingredients: obj.ingredients as ParsedIngredient[],
    notices: sanitizeNotices(obj.notices),
  }
}

/**
 * Backwards-compatible wrapper. Returns ingredients only — used by callers that
 * predate the notices feature. New callers SHALL prefer parseLabel.
 */
export async function parseIngredients(rawText: string): Promise<ParsedIngredient[]> {
  const { ingredients } = await parseLabel(rawText)
  return ingredients
}

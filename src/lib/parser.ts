import { model } from './gemini'
import type { ParsedIngredient } from '@/types/ingredients'

const PARSE_PROMPT = `You are a food ingredient parser. Given raw text from a food packaging label, extract and structure the ingredient list.

Tasks:
1. Filter out non-ingredient content (nutritional information, storage instructions, manufacturing details, allergen warnings, marketing text, barcode numbers)
2. Split compound ingredients enclosed in parentheses/brackets into individual items (e.g., "調味料（蔗糖、鹽）" → extract 蔗糖 and 鹽 separately)
3. Handle nested parentheses (e.g., "巧克力（可可粉、糖、乳化劑（大豆卵磷脂））")
4. Merge broken lines and normalize whitespace within ingredient names
5. For Japanese ingredient names, provide the Chinese or English equivalent as normalizedName
6. For Chinese/English ingredients, normalizedName should be the cleaned version of the original

Output ONLY a valid JSON array, no other text. Each element must have:
- "originalText": the ingredient name as shown on the packaging (original language)
- "normalizedName": cleaned name in Chinese or English for database matching

Example output:
[
  {"originalText": "砂糖", "normalizedName": "砂糖"},
  {"originalText": "ゼラチン", "normalizedName": "明膠"},
  {"originalText": "小麦粉", "normalizedName": "小麥粉"}
]`

export async function parseIngredients(rawText: string): Promise<ParsedIngredient[]> {
  const result = await model.generateContent([
    PARSE_PROMPT,
    `Raw ingredient text:\n${rawText}`,
  ])

  const response = result.response
  const text = response.text().trim()

  // Extract JSON array from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('AI 無法解析成分資料，請重新輸入')
  }

  const parsed: ParsedIngredient[] = JSON.parse(jsonMatch[0])

  // Validate structure
  for (const item of parsed) {
    if (typeof item.originalText !== 'string' || typeof item.normalizedName !== 'string') {
      throw new Error('AI 回傳的成分資料格式不正確')
    }
  }

  return parsed
}

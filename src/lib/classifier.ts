import { model } from './gemini'
import { matchIngredient } from './ingredient-matcher'
import type {
  ParsedIngredient,
  ClassifiedIngredient,
  IngredientCategory,
} from '@/types/ingredients'

const CLASSIFY_PROMPT = `You are a vegetarian food ingredient classifier for Taiwan's vegetarian categories.

Classify each ingredient into exactly ONE of these categories:
- "non-vegetarian": animal-derived (meat, fish, shellfish, animal fat, gelatin, etc.)
- "five-pungent": five pungent vegetables (onion/蔥, garlic/蒜, chives/韭, rakkyo/蕗蕎/薤, asafoetida/興渠/阿魏)
- "egg": egg or egg-derived products
- "dairy": milk or milk-derived products
- "ambiguous": cannot determine from name alone
- "vegetarian": plant-based, safe for all vegetarian types

Output ONLY a valid JSON array. Each element must have:
- "name": the ingredient name (as provided)
- "category": one of the six categories above
- "description": brief explanation in Traditional Chinese (繁體中文) of why this classification

Example:
[
  {"name": "紅花籽油", "category": "vegetarian", "description": "植物性油脂，由紅花籽榨取"},
  {"name": "蜂王漿", "category": "non-vegetarian", "description": "蜜蜂分泌物，屬動物性產品"}
]`

interface AIClassification {
  name: string
  category: IngredientCategory
  description: string
}

export async function classifyWithAI(
  ingredientNames: string[]
): Promise<AIClassification[]> {
  if (ingredientNames.length === 0) return []

  const result = await model.generateContent([
    CLASSIFY_PROMPT,
    `Ingredients to classify:\n${ingredientNames.map((n) => `- ${n}`).join('\n')}`,
  ])

  const text = result.response.text().trim()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('AI 分類回傳格式錯誤')
  }

  const classifications: AIClassification[] = JSON.parse(jsonMatch[0])
  return classifications
}

export async function classifyIngredients(
  ingredients: ParsedIngredient[]
): Promise<ClassifiedIngredient[]> {
  const classified: ClassifiedIngredient[] = []
  const unmatchedIngredients: { index: number; ingredient: ParsedIngredient }[] = []

  // Phase 1: Database matching
  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i]
    const match = matchIngredient(ingredient.normalizedName)

    if (match) {
      classified.push({
        originalText: ingredient.originalText,
        normalizedName: ingredient.normalizedName,
        category: match.ingredient.category,
        description: match.ingredient.description,
        source: 'database',
        matchType: match.matchType,
      })
    } else {
      // Placeholder — will be filled by AI
      classified.push({
        originalText: ingredient.originalText,
        normalizedName: ingredient.normalizedName,
        category: 'ambiguous',
        description: '',
        source: 'ai',
      })
      unmatchedIngredients.push({ index: i, ingredient })
    }
  }

  // Phase 2: AI classification for unmatched
  if (unmatchedIngredients.length > 0) {
    const names = unmatchedIngredients.map((u) => u.ingredient.normalizedName)
    const aiResults = await classifyWithAI(names)

    for (let j = 0; j < unmatchedIngredients.length; j++) {
      const { index } = unmatchedIngredients[j]
      const aiResult = aiResults[j]
      if (aiResult) {
        classified[index] = {
          ...classified[index],
          category: aiResult.category,
          description: aiResult.description,
          source: 'ai',
        }
      }
    }
  }

  return classified
}

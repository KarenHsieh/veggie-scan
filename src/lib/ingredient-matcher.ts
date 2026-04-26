import ingredientsData from '@/data/ingredients.json'
import type { Ingredient, MatchResult } from '@/types/ingredients'

const ingredients: Ingredient[] = ingredientsData.ingredients as Ingredient[]

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

export function matchIngredient(input: string): MatchResult | null {
  const normalized = normalize(input)
  if (!normalized) return null

  // Phase 1: Exact match against canonical names and aliases
  for (const ingredient of ingredients) {
    if (normalize(ingredient.canonicalName) === normalized) {
      return { ingredient, matchType: 'exact', matchedAlias: ingredient.canonicalName }
    }
    for (const alias of ingredient.aliases) {
      if (normalize(alias) === normalized) {
        return { ingredient, matchType: 'exact', matchedAlias: alias }
      }
    }
  }

  // Phase 2: Partial match — input contains a known name, or a known name contains the input
  let bestMatch: MatchResult | null = null
  let bestLength = 0

  for (const ingredient of ingredients) {
    const candidates = [ingredient.canonicalName, ...ingredient.aliases]
    for (const candidate of candidates) {
      const normalizedCandidate = normalize(candidate)
      // Check if input contains the candidate (e.g., "大蒜粉" contains "大蒜")
      if (normalized.includes(normalizedCandidate) && normalizedCandidate.length > bestLength) {
        bestLength = normalizedCandidate.length
        bestMatch = { ingredient, matchType: 'partial', matchedAlias: candidate }
      }
    }
  }

  return bestMatch
}

export function matchAllIngredients(inputs: string[]): Map<string, MatchResult | null> {
  const results = new Map<string, MatchResult | null>()
  for (const input of inputs) {
    results.set(input, matchIngredient(input))
  }
  return results
}

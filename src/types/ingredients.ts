export type IngredientCategory =
  | 'non-vegetarian'
  | 'five-pungent'
  | 'egg'
  | 'dairy'
  | 'ambiguous'
  | 'vegetarian'

export interface Ingredient {
  id: string
  canonicalName: string
  category: IngredientCategory
  description: string
  aliases: string[]
}

export interface ParsedIngredient {
  originalText: string
  normalizedName: string
}

export type MatchType = 'exact' | 'partial'

export interface MatchResult {
  ingredient: Ingredient
  matchType: MatchType
  matchedAlias: string
}

export type VegetarianType =
  | 'vegan'
  | 'egg'
  | 'lacto'
  | 'lacto-ovo'
  | 'five-pungent'

export interface ClassifiedIngredient {
  originalText: string
  normalizedName: string
  category: IngredientCategory
  description: string
  source: 'database' | 'ai'
  matchType?: MatchType
}

export interface Verdict {
  dietType: VegetarianType
  isSafe: boolean
  hasAmbiguous: boolean
  summary: string
  description: string
}

export type NoticeType = 'allergen' | 'storage' | 'expiration' | 'other'

export interface Notice {
  type: NoticeType
  text: string
}

export interface AnalysisResult {
  ingredients: ClassifiedIngredient[]
  verdict: Verdict
  notices: Notice[]
}

export interface FeedbackPayload {
  ingredients: ClassifiedIngredient[]
  flaggedIndices: number[]
  dietType: VegetarianType
  userNote?: string
  suggestedCategory?: IngredientCategory
}

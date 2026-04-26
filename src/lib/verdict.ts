import type {
  ClassifiedIngredient,
  IngredientCategory,
  VegetarianType,
  Verdict,
} from '@/types/ingredients'

// Which categories each diet type can consume
const DIET_ALLOWED_CATEGORIES: Record<VegetarianType, Set<IngredientCategory>> = {
  'vegan': new Set(['vegetarian']),
  'egg': new Set(['vegetarian', 'egg']),
  'lacto': new Set(['vegetarian', 'dairy']),
  'lacto-ovo': new Set(['vegetarian', 'egg', 'dairy']),
  'five-pungent': new Set(['vegetarian', 'egg', 'dairy', 'five-pungent']),
}

const DIET_LABELS: Record<VegetarianType, string> = {
  'vegan': '全素',
  'egg': '蛋素',
  'lacto': '奶素',
  'lacto-ovo': '蛋奶素',
  'five-pungent': '五辛素',
}

function isCategorySafe(category: IngredientCategory, dietType: VegetarianType): boolean {
  if (category === 'ambiguous') return true // ambiguous doesn't make it "unsafe", just uncertain
  return DIET_ALLOWED_CATEGORIES[dietType].has(category)
}

export function computeVerdict(
  ingredients: ClassifiedIngredient[],
  dietType: VegetarianType
): Verdict {
  const hasNonVegetarian = ingredients.some((i) => i.category === 'non-vegetarian')
  const hasAmbiguous = ingredients.some((i) => i.category === 'ambiguous')
  const unsafeIngredients = ingredients.filter(
    (i) => i.category !== 'ambiguous' && !isCategorySafe(i.category, dietType)
  )
  const isSafe = unsafeIngredients.length === 0

  const dietLabel = DIET_LABELS[dietType]

  let summary: string
  let description: string

  if (hasNonVegetarian) {
    const nonVegNames = ingredients
      .filter((i) => i.category === 'non-vegetarian')
      .map((i) => i.originalText)
      .join('、')
    summary = `含有動物性成分`
    description = `此商品含有「${nonVegNames}」，不適合素食者食用`
  } else if (!isSafe) {
    const unsafeNames = unsafeIngredients.map((i) => i.originalText).join('、')
    summary = `${dietLabel}不可食用`
    description = `此商品含有「${unsafeNames}」，不適合${dietLabel}者食用`
  } else if (hasAmbiguous) {
    const ambiguousNames = ingredients
      .filter((i) => i.category === 'ambiguous')
      .map((i) => i.originalText)
      .join('、')
    summary = `${dietLabel}可能可食用`
    description = `此商品含有無法確定的成分「${ambiguousNames}」，建議確認後再食用`
  } else {
    summary = `${dietLabel}可食用`
    description = `此商品所有成分皆適合${dietLabel}者食用`
  }

  return { dietType, isSafe, hasAmbiguous, summary, description }
}

export function isSafeForDiet(
  category: IngredientCategory,
  dietType: VegetarianType
): boolean {
  return isCategorySafe(category, dietType)
}

import { describe, it, expect } from 'vitest'
import { computeVerdict } from './verdict'
import type { ClassifiedIngredient, VegetarianType } from '@/types/ingredients'

function makeIngredient(
  name: string,
  category: ClassifiedIngredient['category']
): ClassifiedIngredient {
  return {
    originalText: name,
    normalizedName: name,
    category,
    description: '',
    source: 'database',
  }
}

describe('computeVerdict', () => {
  it('returns safe for all-vegan ingredients with vegan diet', () => {
    const ingredients = [
      makeIngredient('砂糖', 'vegetarian'),
      makeIngredient('麵粉', 'vegetarian'),
    ]
    const verdict = computeVerdict(ingredients, 'vegan')
    expect(verdict.isSafe).toBe(true)
    expect(verdict.hasAmbiguous).toBe(false)
  })

  it('returns unsafe for non-vegetarian ingredients', () => {
    const ingredients = [
      makeIngredient('砂糖', 'vegetarian'),
      makeIngredient('明膠', 'non-vegetarian'),
    ]
    const verdict = computeVerdict(ingredients, 'vegan')
    expect(verdict.isSafe).toBe(false)
  })

  it('returns unsafe for five-pungent with vegan diet', () => {
    const ingredients = [
      makeIngredient('砂糖', 'vegetarian'),
      makeIngredient('大蒜', 'five-pungent'),
    ]
    const verdict = computeVerdict(ingredients, 'vegan')
    expect(verdict.isSafe).toBe(false)
  })

  it('returns safe for five-pungent with five-pungent diet', () => {
    const ingredients = [
      makeIngredient('砂糖', 'vegetarian'),
      makeIngredient('大蒜', 'five-pungent'),
    ]
    const verdict = computeVerdict(ingredients, 'five-pungent')
    expect(verdict.isSafe).toBe(true)
  })

  it('returns unsafe for dairy with vegan diet', () => {
    const ingredients = [
      makeIngredient('奶粉', 'dairy'),
    ]
    const verdict = computeVerdict(ingredients, 'vegan')
    expect(verdict.isSafe).toBe(false)
  })

  it('returns safe for dairy with lacto diet', () => {
    const ingredients = [
      makeIngredient('奶粉', 'dairy'),
    ]
    const verdict = computeVerdict(ingredients, 'lacto')
    expect(verdict.isSafe).toBe(true)
  })

  it('returns unsafe for egg with lacto diet', () => {
    const ingredients = [
      makeIngredient('蛋黃', 'egg'),
    ]
    const verdict = computeVerdict(ingredients, 'lacto')
    expect(verdict.isSafe).toBe(false)
  })

  it('returns safe for egg with egg diet', () => {
    const ingredients = [
      makeIngredient('蛋黃', 'egg'),
    ]
    const verdict = computeVerdict(ingredients, 'egg')
    expect(verdict.isSafe).toBe(true)
  })

  it('returns safe for egg+dairy with lacto-ovo diet', () => {
    const ingredients = [
      makeIngredient('蛋黃', 'egg'),
      makeIngredient('奶粉', 'dairy'),
    ]
    const verdict = computeVerdict(ingredients, 'lacto-ovo')
    expect(verdict.isSafe).toBe(true)
  })

  it('flags ambiguous ingredients', () => {
    const ingredients = [
      makeIngredient('砂糖', 'vegetarian'),
      makeIngredient('香料', 'ambiguous'),
    ]
    const verdict = computeVerdict(ingredients, 'vegan')
    expect(verdict.hasAmbiguous).toBe(true)
  })

  it('non-vegetarian overrides ambiguous in safety check', () => {
    const ingredients = [
      makeIngredient('明膠', 'non-vegetarian'),
      makeIngredient('香料', 'ambiguous'),
    ]
    const verdict = computeVerdict(ingredients, 'vegan')
    expect(verdict.isSafe).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { matchIngredient } from './ingredient-matcher'

describe('matchIngredient', () => {
  it('matches by canonical name (exact)', () => {
    const result = matchIngredient('明膠')
    expect(result).not.toBeNull()
    expect(result!.ingredient.id).toBe('gelatin')
    expect(result!.matchType).toBe('exact')
  })

  it('matches by alias (exact)', () => {
    const result = matchIngredient('gelatin')
    expect(result).not.toBeNull()
    expect(result!.ingredient.id).toBe('gelatin')
    expect(result!.matchType).toBe('exact')
  })

  it('matches case-insensitively', () => {
    const result = matchIngredient('GELATIN')
    expect(result).not.toBeNull()
    expect(result!.ingredient.id).toBe('gelatin')
  })

  it('matches Japanese alias', () => {
    const result = matchIngredient('ゼラチン')
    expect(result).not.toBeNull()
    expect(result!.ingredient.id).toBe('gelatin')
  })

  it('matches food additive code', () => {
    const result = matchIngredient('E441')
    expect(result).not.toBeNull()
    expect(result!.ingredient.id).toBe('gelatin')
  })

  it('matches with whitespace trimming', () => {
    const result = matchIngredient('  明膠  ')
    expect(result).not.toBeNull()
    expect(result!.ingredient.id).toBe('gelatin')
  })

  it('partial matches compound names', () => {
    const result = matchIngredient('大蒜粉')
    expect(result).not.toBeNull()
    expect(result!.ingredient.id).toBe('garlic')
    expect(result!.matchType).toBe('partial')
  })

  it('prefers exact match over partial', () => {
    const result = matchIngredient('大蒜')
    expect(result).not.toBeNull()
    expect(result!.matchType).toBe('exact')
  })

  it('returns null for unknown ingredient', () => {
    const result = matchIngredient('紅花籽油')
    expect(result).toBeNull()
  })

  it('matches five-pungent ingredients', () => {
    const result = matchIngredient('韭菜')
    expect(result).not.toBeNull()
    expect(result!.ingredient.category).toBe('five-pungent')
  })

  it('matches ambiguous ingredients', () => {
    const result = matchIngredient('香料')
    expect(result).not.toBeNull()
    expect(result!.ingredient.category).toBe('ambiguous')
  })

  it('matches dairy ingredients', () => {
    const result = matchIngredient('脫脂奶粉')
    expect(result).not.toBeNull()
    expect(result!.ingredient.category).toBe('dairy')
  })

  it('matches egg ingredients', () => {
    const result = matchIngredient('蛋黃')
    expect(result).not.toBeNull()
    expect(result!.ingredient.category).toBe('egg')
  })
})

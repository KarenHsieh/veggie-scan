'use client'

import { useState } from 'react'
import type { ClassifiedIngredient, IngredientCategory, VegetarianType } from '@/types/ingredients'
import { isSafeForDiet } from '@/lib/verdict'

interface GroupConfig {
  key: string
  label: string
  icon: string
  categories: IngredientCategory[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const GROUPS: GroupConfig[] = [
  { key: 'non-veg', label: '不可食用（動物性成分）', icon: '🚫', categories: ['non-vegetarian'] },
  { key: 'pungent', label: '注意（五辛）', icon: '⚠️', categories: ['five-pungent'] },
  { key: 'egg-dairy', label: '含蛋奶', icon: '🥛', categories: ['egg', 'dairy'] },
  { key: 'ambiguous', label: '無法確定', icon: '❓', categories: ['ambiguous'] },
  { key: 'safe', label: '全素可食用', icon: '✅', categories: ['vegetarian'], collapsible: true, defaultCollapsed: true },
]

interface IndexedIngredient {
  item: ClassifiedIngredient
  index: number
}

interface IngredientGroupProps {
  ingredients: ClassifiedIngredient[]
  dietType: VegetarianType
  selectedIndices: ReadonlySet<number>
  onToggleIndex: (index: number) => void
}

export default function IngredientGroup({
  ingredients,
  dietType,
  selectedIndices,
  onToggleIndex,
}: IngredientGroupProps) {
  const indexed: IndexedIngredient[] = ingredients.map((item, index) => ({ item, index }))

  return (
    <div className="space-y-4 sm:space-y-5">
      {GROUPS.map((group, idx) => {
        const items = indexed.filter(({ item }) => group.categories.includes(item.category))
        if (items.length === 0) return null

        return (
          <div key={group.key} className={`animate-fadeInUp stagger-${idx + 1}`}>
            <GroupSection
              config={group}
              items={items}
              dietType={dietType}
              selectedIndices={selectedIndices}
              onToggleIndex={onToggleIndex}
            />
          </div>
        )
      })}
    </div>
  )
}

function GroupSection({
  config,
  items,
  dietType,
  selectedIndices,
  onToggleIndex,
}: {
  config: GroupConfig
  items: IndexedIngredient[]
  dietType: VegetarianType
  selectedIndices: ReadonlySet<number>
  onToggleIndex: (index: number) => void
}) {
  const [collapsed, setCollapsed] = useState(config.defaultCollapsed ?? false)

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ borderColor: 'var(--color-border)', background: 'white' }}
    >
      <button
        onClick={() => config.collapsible && setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2.5 px-4 sm:px-5 py-3.5 sm:py-4 text-left transition-colors duration-150"
        style={{
          background: 'var(--color-cream)',
          cursor: config.collapsible ? 'pointer' : 'default',
        }}
      >
        <span role="img" className="text-base sm:text-lg">{config.icon}</span>
        <span className="font-semibold text-sm sm:text-base" style={{ color: 'var(--color-charcoal)' }}>
          {config.label}
        </span>
        <span className="text-xs sm:text-sm" style={{ color: 'var(--color-warm-gray)' }}>
          ({items.length})
        </span>
        {config.collapsible && (
          <span
            className="ml-auto text-xs sm:text-sm"
            style={{ color: 'var(--color-warm-gray-light)' }}
          >
            {collapsed ? '展開 ▾' : '收合 ▴'}
          </span>
        )}
      </button>
      <div
        className="transition-all duration-300 overflow-hidden"
        style={{
          maxHeight: collapsed ? '0px' : `${items.length * 110}px`,
          opacity: collapsed ? 0 : 1,
        }}
      >
        <div style={{ borderTop: '1px solid var(--color-border-light)' }}>
          {items.map(({ item, index }, idx) => (
            <label
              key={index}
              className="px-4 sm:px-5 py-3.5 sm:py-4 flex items-start gap-3 cursor-pointer transition-colors duration-150 hover:bg-[var(--color-cream-deep)]"
              style={{
                borderBottom: idx < items.length - 1 ? '1px solid var(--color-border-light)' : 'none',
              }}
            >
              <input
                type="checkbox"
                aria-label={`回報「${item.originalText}」分類有誤`}
                checked={selectedIndices.has(index)}
                onChange={() => onToggleIndex(index)}
                className="mt-1 w-4 h-4 flex-shrink-0 cursor-pointer accent-[var(--color-sage)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="font-medium text-sm sm:text-base" style={{ color: 'var(--color-charcoal)' }}>
                    {item.originalText}
                  </span>
                  {item.originalText !== item.normalizedName && (
                    <span className="text-xs sm:text-sm" style={{ color: 'var(--color-warm-gray-light)' }}>
                      ({item.normalizedName})
                    </span>
                  )}
                  {item.source === 'ai' && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(58, 107, 53, 0.08)', color: 'var(--color-sage)' }}
                    >
                      AI 判定
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-warm-gray)' }}>
                  {item.description}
                </p>
              </div>
              <SafetyBadge category={item.category} dietType={dietType} />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function SafetyBadge({
  category,
  dietType,
}: {
  category: IngredientCategory
  dietType: VegetarianType
}) {
  if (category === 'ambiguous') {
    return (
      <span
        className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
        style={{ background: '#fef9ec', color: '#8a6d14', border: '1px solid rgba(180, 140, 40, 0.2)' }}
      >
        待確認
      </span>
    )
  }

  const safe = isSafeForDiet(category, dietType)
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
      style={{
        background: safe ? 'var(--color-sage-mist)' : '#fef2f0',
        color: safe ? 'var(--color-sage)' : 'var(--color-terracotta)',
        border: safe ? '1px solid rgba(58, 107, 53, 0.15)' : '1px solid rgba(196, 97, 58, 0.15)',
      }}
    >
      {safe ? '可食用' : '不可食用'}
    </span>
  )
}

'use client'

import { useState } from 'react'
import type { ClassifiedIngredient, VegetarianType } from '@/types/ingredients'
import { computeVerdict } from '@/lib/verdict'
import VegetarianTypeSwitcher from './VegetarianTypeSwitcher'
import VerdictBanner from './VerdictBanner'
import IngredientGroup from './IngredientGroup'

interface ResultDisplayProps {
  ingredients: ClassifiedIngredient[]
  onClear: () => void
}

export default function ResultDisplay({ ingredients, onClear }: ResultDisplayProps) {
  const [dietType, setDietType] = useState<VegetarianType>('vegan')
  const verdict = computeVerdict(ingredients, dietType)

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h2
          className="text-lg sm:text-xl font-bold"
          style={{ color: 'var(--color-charcoal)' }}
        >
          分析結果
        </h2>
        <button
          onClick={onClear}
          className="flex-shrink-0 flex items-center gap-1 text-xs sm:text-sm transition-opacity duration-150 hover:opacity-70 active:opacity-50"
          style={{ color: 'var(--color-sage)' }}
        >
          繼續掃描下一張
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div>
        <p className="text-xs sm:text-sm mb-2.5" style={{ color: 'var(--color-warm-gray)' }}>
          選擇您的素食類型：
        </p>
        <VegetarianTypeSwitcher value={dietType} onChange={setDietType} />
      </div>

      <VerdictBanner verdict={verdict} />

      <IngredientGroup ingredients={ingredients} dietType={dietType} />
    </div>
  )
}

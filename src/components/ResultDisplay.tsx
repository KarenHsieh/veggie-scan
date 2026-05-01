'use client'

import { useCallback, useState } from 'react'
import type { ClassifiedIngredient, VegetarianType } from '@/types/ingredients'
import { computeVerdict } from '@/lib/verdict'
import VegetarianTypeSwitcher from './VegetarianTypeSwitcher'
import VerdictBanner from './VerdictBanner'
import IngredientGroup from './IngredientGroup'
import FeedbackModal from './FeedbackModal'

interface ResultDisplayProps {
  ingredients: ClassifiedIngredient[]
  onClear: () => void
}

export default function ResultDisplay({ ingredients, onClear }: ResultDisplayProps) {
  const [dietType, setDietType] = useState<VegetarianType>('vegan')
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => new Set())
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const verdict = computeVerdict(ingredients, dietType)

  const toggleIndex = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const handleFeedbackSubmitted = useCallback(() => {
    setSelectedIndices(new Set())
  }, [])

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

      <IngredientGroup
        ingredients={ingredients}
        dietType={dietType}
        selectedIndices={selectedIndices}
        onToggleIndex={toggleIndex}
      />

      <div
        className="rounded-2xl border px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-cream)' }}
      >
        <div className="text-xs sm:text-sm" style={{ color: 'var(--color-warm-gray)' }}>
          {selectedIndices.size > 0
            ? `已勾選 ${selectedIndices.size} 筆可疑成分`
            : '覺得分類有誤？勾選成分後送出回報'}
        </div>
        <button
          onClick={() => setFeedbackOpen(true)}
          className="self-start sm:self-auto px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 hover:bg-white"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-charcoal)',
            background: 'white',
          }}
        >
          回報有誤
        </button>
      </div>

      {feedbackOpen && (
        <FeedbackModal
          ingredients={ingredients}
          dietType={dietType}
          initialSelectedIndices={selectedIndices}
          onClose={() => setFeedbackOpen(false)}
          onSubmitted={handleFeedbackSubmitted}
        />
      )}
    </div>
  )
}

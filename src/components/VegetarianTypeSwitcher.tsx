'use client'

import type { VegetarianType } from '@/types/ingredients'

const DIET_OPTIONS: { value: VegetarianType; label: string }[] = [
  { value: 'vegan', label: '全素' },
  { value: 'egg', label: '蛋素' },
  { value: 'lacto', label: '奶素' },
  { value: 'lacto-ovo', label: '蛋奶素' },
  { value: 'five-pungent', label: '五辛素' },
]

interface VegetarianTypeSwitcherProps {
  value: VegetarianType
  onChange: (type: VegetarianType) => void
}

export default function VegetarianTypeSwitcher({ value, onChange }: VegetarianTypeSwitcherProps) {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-2.5">
      {DIET_OPTIONS.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border active:scale-95"
            style={{
              background: isActive ? 'var(--color-sage)' : 'white',
              color: isActive ? 'white' : 'var(--color-warm-gray)',
              borderColor: isActive ? 'var(--color-sage)' : 'var(--color-border)',
              boxShadow: isActive ? '0 2px 8px rgba(58, 107, 53, 0.25)' : 'none',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

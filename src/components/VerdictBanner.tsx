'use client'

import type { Verdict } from '@/types/ingredients'

interface VerdictBannerProps {
  verdict: Verdict
}

export default function VerdictBanner({ verdict }: VerdictBannerProps) {
  const hasNonVeg = verdict.summary.includes('動物性')
  const isUnsafe = !verdict.isSafe

  let bgColor: string
  let borderColor: string
  let icon: string

  if (hasNonVeg || isUnsafe) {
    bgColor = '#fef2f0'
    borderColor = 'rgba(196, 97, 58, 0.25)'
    icon = '❌'
  } else if (verdict.hasAmbiguous) {
    bgColor = '#fef9ec'
    borderColor = 'rgba(180, 140, 40, 0.25)'
    icon = '⚠️'
  } else {
    bgColor = 'var(--color-sage-mist)'
    borderColor = 'rgba(58, 107, 53, 0.2)'
    icon = '✅'
  }

  return (
    <div
      className="rounded-2xl border-2 p-5 sm:p-6 animate-scaleIn"
      style={{ background: bgColor, borderColor }}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="text-2xl sm:text-3xl flex-shrink-0" role="img">{icon}</span>
        <div>
          <p
            className="text-lg sm:text-xl font-bold"
            style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-display)' }}
          >
            {verdict.summary}
          </p>
          <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--color-warm-gray)' }}>
            {verdict.description}
          </p>
        </div>
      </div>
    </div>
  )
}

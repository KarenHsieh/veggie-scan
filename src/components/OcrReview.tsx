'use client'

import { useState } from 'react'

interface OcrReviewProps {
  initialText: string
  onConfirm: (text: string) => void
  onRescan: () => void
  disabled?: boolean
}

export default function OcrReview({ initialText, onConfirm, onRescan, disabled }: OcrReviewProps) {
  const [text, setText] = useState(initialText)

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-2">
        <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--color-charcoal)' }}>
          OCR 辨識結果
        </h3>
        <span className="text-xs sm:text-sm" style={{ color: 'var(--color-warm-gray)' }}>
          （可手動修正後再送出）
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        className="w-full p-4 sm:p-5 rounded-2xl resize-none text-sm sm:text-base transition-all duration-200 border disabled:opacity-40"
        style={{
          height: 'clamp(180px, 30vh, 280px)',
          borderColor: 'var(--color-border)',
          background: 'white',
          color: 'var(--color-charcoal)',
          boxShadow: 'var(--shadow-soft)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-sage)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58, 107, 53, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.boxShadow = 'var(--shadow-soft)'
        }}
      />
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onConfirm(text)}
          disabled={disabled || !text.trim()}
          className="flex-1 py-3 px-5 rounded-xl font-medium text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
          style={{ background: 'var(--color-sage)' }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = 'var(--color-sage-dark)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-sage)')}
        >
          使用此文字
        </button>
        <button
          onClick={onRescan}
          disabled={disabled}
          className="py-3 px-5 rounded-xl font-medium text-sm transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm active:scale-[0.98]"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-charcoal)',
            background: 'white',
          }}
        >
          重新掃描
        </button>
      </div>
    </div>
  )
}

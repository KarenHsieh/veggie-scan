'use client'

import { useEffect, useMemo, useState } from 'react'
import type {
  ClassifiedIngredient,
  FeedbackPayload,
  IngredientCategory,
  VegetarianType,
} from '@/types/ingredients'

const MAX_NOTE_LENGTH = 1000

const CATEGORY_OPTIONS: { value: IngredientCategory; label: string }[] = [
  { value: 'non-vegetarian', label: '不可食用（動物性）' },
  { value: 'five-pungent', label: '五辛' },
  { value: 'egg', label: '蛋' },
  { value: 'dairy', label: '奶' },
  { value: 'ambiguous', label: '無法確定' },
  { value: 'vegetarian', label: '全素' },
]

type SubmitStatus =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

interface FeedbackModalProps {
  ingredients: ClassifiedIngredient[]
  dietType: VegetarianType
  initialSelectedIndices: ReadonlySet<number>
  onClose: () => void
  onSubmitted: () => void
}

export default function FeedbackModal({
  ingredients,
  dietType,
  initialSelectedIndices,
  onClose,
  onSubmitted,
}: FeedbackModalProps) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(initialSelectedIndices))
  const [userNote, setUserNote] = useState('')
  const [suggestedCategory, setSuggestedCategory] = useState<IngredientCategory | ''>('')
  const [status, setStatus] = useState<SubmitStatus>({ kind: 'idle' })

  // ESC closes the modal (unless submitting).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status.kind !== 'submitting') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, status.kind])

  const canSubmit = useMemo(() => {
    if (status.kind === 'submitting' || status.kind === 'success') return false
    return selected.size > 0 || userNote.trim().length > 0
  }, [selected.size, userNote, status.kind])

  function toggleIndex(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setStatus({ kind: 'submitting' })

    const payload: FeedbackPayload = {
      ingredients,
      flaggedIndices: Array.from(selected).sort((a, b) => a - b),
      dietType,
      userNote: userNote.trim() || undefined,
      suggestedCategory: suggestedCategory || undefined,
    }

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 200) {
        setStatus({ kind: 'success' })
        return
      }
      if (res.status === 429) {
        setStatus({ kind: 'error', message: '回報次數過多，請稍後再試' })
        return
      }
      const data = await res.json().catch(() => ({}))
      setStatus({
        kind: 'error',
        message:
          (typeof data?.message === 'string' && data.message) ||
          '回報送出失敗，請稍後再試',
      })
    } catch {
      setStatus({ kind: 'error', message: '網路錯誤，請稍後再試' })
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && status.kind !== 'submitting') {
      handleClose()
    }
  }

  function handleClose() {
    if (status.kind === 'submitting') return
    if (status.kind === 'success') onSubmitted()
    onClose()
  }

  const remaining = MAX_NOTE_LENGTH - userNote.length

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-8 animate-fadeIn"
      style={{ background: 'rgba(20, 20, 20, 0.45)' }}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] overflow-hidden bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-fadeInUp"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <header
          className="px-5 sm:px-6 py-4 flex items-center justify-between border-b"
          style={{ borderColor: 'var(--color-border-light)' }}
        >
          <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--color-charcoal)' }}>
            回報分析有誤
          </h2>
          <button
            onClick={handleClose}
            disabled={status.kind === 'submitting'}
            aria-label="關閉"
            className="text-2xl leading-none transition-opacity duration-150 hover:opacity-60 disabled:opacity-30"
            style={{ color: 'var(--color-warm-gray)' }}
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-5">
          {status.kind === 'success' ? (
            <div className="py-6 text-center space-y-3">
              <div
                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-sage-mist)', color: 'var(--color-sage)' }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium" style={{ color: 'var(--color-charcoal)' }}>
                已收到您的回報
              </p>
              <p className="text-sm" style={{ color: 'var(--color-warm-gray)' }}>
                感謝您協助我們改善分類準確度。
              </p>
            </div>
          ) : (
            <>
              <section>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-charcoal)' }}>
                  選擇可能有誤的成分
                </p>
                <div
                  className="rounded-xl border max-h-60 overflow-y-auto"
                  style={{ borderColor: 'var(--color-border-light)' }}
                >
                  {ingredients.map((item, idx) => (
                    <label
                      key={idx}
                      className="px-3 py-2.5 flex items-start gap-2.5 cursor-pointer hover:bg-[var(--color-cream-deep)]"
                      style={{
                        borderBottom: idx < ingredients.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(idx)}
                        onChange={() => toggleIndex(idx)}
                        className="mt-1 w-4 h-4 flex-shrink-0 accent-[var(--color-sage)]"
                      />
                      <div className="flex-1 min-w-0 text-sm">
                        <span style={{ color: 'var(--color-charcoal)' }}>{item.originalText}</span>
                        <span className="ml-1.5 text-xs" style={{ color: 'var(--color-warm-gray-light)' }}>
                          目前分類：{item.category}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <label
                  htmlFor="feedback-suggested-category"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-charcoal)' }}
                >
                  建議的正確分類（選填）
                </label>
                <select
                  id="feedback-suggested-category"
                  value={suggestedCategory}
                  onChange={(e) => setSuggestedCategory(e.target.value as IngredientCategory | '')}
                  className="w-full px-3 py-2 rounded-lg text-sm border bg-white"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-charcoal)' }}
                >
                  <option value="">— 不指定 —</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </section>

              <section>
                <label
                  htmlFor="feedback-user-note"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-charcoal)' }}
                >
                  補充說明（選填）
                </label>
                <textarea
                  id="feedback-user-note"
                  value={userNote}
                  onChange={(e) =>
                    setUserNote(e.target.value.slice(0, MAX_NOTE_LENGTH))
                  }
                  rows={4}
                  placeholder="可以告訴我們哪裡不對、或補充其他資訊"
                  className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-charcoal)' }}
                />
                <p
                  className="text-xs mt-1 text-right"
                  style={{ color: 'var(--color-warm-gray-light)' }}
                >
                  {remaining} / {MAX_NOTE_LENGTH}
                </p>
              </section>

              {status.kind === 'error' && (
                <div
                  className="rounded-lg p-3 text-sm"
                  style={{ background: 'var(--color-terracotta-light)', color: 'var(--color-terracotta)' }}
                >
                  {status.message}
                </div>
              )}
            </>
          )}
        </div>

        <footer
          className="px-5 sm:px-6 py-4 flex items-center justify-end gap-3 border-t"
          style={{ borderColor: 'var(--color-border-light)' }}
        >
          {status.kind === 'success' ? (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ background: 'var(--color-sage)' }}
            >
              關閉
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={status.kind === 'submitting'}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors duration-150 hover:bg-[var(--color-cream)] disabled:opacity-40"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-charcoal)',
                  background: 'white',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--color-sage)' }}
              >
                {status.kind === 'submitting' ? '送出中⋯' : '送出回報'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}

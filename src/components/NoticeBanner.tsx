'use client'

import type { Notice, NoticeType } from '@/types/ingredients'

interface NoticeGroupConfig {
  type: NoticeType
  label: string
}

const GROUP_ORDER: NoticeGroupConfig[] = [
  { type: 'allergen', label: '過敏原' },
  { type: 'storage', label: '保存方式' },
  { type: 'expiration', label: '賞味期限' },
  { type: 'other', label: '其他' },
]

const MAX_PER_GROUP = 5

interface NoticeBannerProps {
  notices: Notice[]
  types?: NoticeType[]
  title?: string
  headerIcon?: string
  subtle?: boolean
}

export default function NoticeBanner({
  notices,
  types,
  title = '包裝注意事項',
  headerIcon = '⚠️',
  subtle = false,
}: NoticeBannerProps) {
  const filtered = types ? notices.filter((n) => types.includes(n.type)) : notices
  if (filtered.length === 0) return null

  const grouped = new Map<NoticeType, Notice[]>()
  for (const notice of filtered) {
    const arr = grouped.get(notice.type) ?? []
    arr.push(notice)
    grouped.set(notice.type, arr)
  }

  const sections = GROUP_ORDER.filter(
    ({ type }) => (grouped.get(type)?.length ?? 0) > 0
  )

  const palette = subtle
    ? {
        border: 'var(--color-border-light)',
        background: 'transparent',
        titleText: 'var(--color-warm-gray)',
        labelText: 'var(--color-warm-gray)',
        mutedText: 'var(--color-warm-gray-light)',
      }
    : {
        border: 'rgba(196, 97, 58, 0.2)',
        background: 'var(--color-cream)',
        titleText: 'var(--color-terracotta)',
        labelText: 'var(--color-terracotta)',
        mutedText: 'var(--color-warm-gray-light)',
      }

  return (
    <section
      className="rounded-2xl border px-4 sm:px-5 py-3.5 sm:py-4"
      style={{ borderColor: palette.border, background: palette.background }}
      aria-label={title}
    >
      <div className="flex items-center gap-1.5 mb-2.5">
        <span aria-hidden="true" className="text-sm">
          {headerIcon}
        </span>
        <h3
          className="text-sm font-medium"
          style={{ color: palette.titleText }}
        >
          {title}
        </h3>
      </div>

      {sections.length === 1 ? (() => {
        const items = grouped.get(sections[0].type) ?? []
        const visible = items.slice(0, MAX_PER_GROUP)
        const truncated = items.length - visible.length
        return (
          <ul className="space-y-1">
            {visible.map((notice, i) => (
              <li
                key={i}
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-charcoal)' }}
              >
                {notice.text}
              </li>
            ))}
            {truncated > 0 && (
              <li className="text-xs italic" style={{ color: palette.mutedText }}>
                ⋯ 還有 {truncated} 則
              </li>
            )}
          </ul>
        )
      })() : (
        <div className="space-y-2.5">
          {sections.map(({ type, label }) => {
            const items = grouped.get(type) ?? []
            const visible = items.slice(0, MAX_PER_GROUP)
            const truncated = items.length - visible.length
            return (
              <div key={type}>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: palette.labelText }}
                >
                  {label}
                </p>
                <ul className="space-y-0.5">
                  {visible.map((notice, i) => (
                    <li
                      key={i}
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--color-charcoal)' }}
                    >
                      {notice.text}
                    </li>
                  ))}
                  {truncated > 0 && (
                    <li className="text-xs italic" style={{ color: palette.mutedText }}>
                      ⋯ 還有 {truncated} 則
                    </li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs mt-2.5" style={{ color: palette.mutedText }}>
        以包裝實際標示為準
      </p>
    </section>
  )
}

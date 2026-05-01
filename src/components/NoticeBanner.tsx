'use client'

import type { Notice, NoticeType } from '@/types/ingredients'

interface NoticeGroupConfig {
  type: NoticeType
  label: string
  icon: string
}

const GROUP_ORDER: NoticeGroupConfig[] = [
  { type: 'allergen', label: '過敏原', icon: '⚠️' },
  { type: 'storage', label: '保存方式', icon: '🌡️' },
  { type: 'expiration', label: '賞味期限', icon: '📅' },
  { type: 'other', label: '其他注意事項', icon: 'ℹ️' },
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
        background: '#fafafa',
        headerBg: '#f5f5f5',
        headerBorder: 'var(--color-border-light)',
        headerText: 'var(--color-warm-gray)',
        sectionBorder: 'var(--color-border-light)',
        labelText: 'var(--color-warm-gray)',
        countText: 'var(--color-warm-gray-light)',
        truncatedText: 'var(--color-warm-gray-light)',
        footerBg: '#fafafa',
        footerText: 'var(--color-warm-gray-light)',
        footerBorder: 'var(--color-border-light)',
      }
    : {
        border: 'rgba(180, 140, 40, 0.25)',
        background: '#fffaf0',
        headerBg: '#fef3d7',
        headerBorder: 'rgba(180, 140, 40, 0.2)',
        headerText: '#7a5a14',
        sectionBorder: 'rgba(180, 140, 40, 0.12)',
        labelText: '#7a5a14',
        countText: '#a07d2c',
        truncatedText: '#a07d2c',
        footerBg: '#fef9ec',
        footerText: '#a07d2c',
        footerBorder: 'rgba(180, 140, 40, 0.12)',
      }

  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: palette.border, background: palette.background }}
      aria-label={title}
    >
      <header
        className="px-4 sm:px-5 py-3 flex items-center gap-2"
        style={{
          background: palette.headerBg,
          borderBottom: `1px solid ${palette.headerBorder}`,
        }}
      >
        <span role="img" aria-hidden="true" className="text-base">
          {headerIcon}
        </span>
        <h3
          className="font-semibold text-sm sm:text-base"
          style={{ color: palette.headerText }}
        >
          {title}
        </h3>
      </header>

      <div className="px-4 sm:px-5 py-3 space-y-3">
        {sections.map(({ type, label, icon }, idx) => {
          const items = grouped.get(type) ?? []
          const visible = items.slice(0, MAX_PER_GROUP)
          const truncated = items.length - visible.length

          return (
            <div
              key={type}
              style={{
                paddingTop: idx > 0 ? '0.5rem' : 0,
                borderTop:
                  idx > 0 ? `1px solid ${palette.sectionBorder}` : 'none',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span role="img" aria-hidden="true" className="text-sm">
                  {icon}
                </span>
                <span
                  className="text-xs sm:text-sm font-medium"
                  style={{ color: palette.labelText }}
                >
                  {label}
                </span>
                <span className="text-xs" style={{ color: palette.countText }}>
                  ({items.length})
                </span>
              </div>
              <ul className="space-y-1 ml-5">
                {visible.map((notice, i) => (
                  <li
                    key={i}
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: 'var(--color-charcoal)' }}
                  >
                    {notice.text}
                  </li>
                ))}
                {truncated > 0 && (
                  <li
                    className="text-xs italic"
                    style={{ color: palette.truncatedText }}
                  >
                    ⋯ 還有 {truncated} 則
                  </li>
                )}
              </ul>
            </div>
          )
        })}
      </div>

      <footer
        className="px-4 sm:px-5 py-2 text-xs"
        style={{
          background: palette.footerBg,
          color: palette.footerText,
          borderTop: `1px solid ${palette.footerBorder}`,
        }}
      >
        以包裝實際標示為準
      </footer>
    </section>
  )
}

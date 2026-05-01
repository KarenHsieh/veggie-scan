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
}

export default function NoticeBanner({ notices }: NoticeBannerProps) {
  if (notices.length === 0) return null

  const grouped = new Map<NoticeType, Notice[]>()
  for (const notice of notices) {
    const arr = grouped.get(notice.type) ?? []
    arr.push(notice)
    grouped.set(notice.type, arr)
  }

  const sections = GROUP_ORDER.filter(({ type }) => (grouped.get(type)?.length ?? 0) > 0)

  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: 'rgba(180, 140, 40, 0.25)',
        background: '#fffaf0',
      }}
      aria-label="包裝注意事項"
    >
      <header
        className="px-4 sm:px-5 py-3 flex items-center gap-2"
        style={{ background: '#fef3d7', borderBottom: '1px solid rgba(180, 140, 40, 0.2)' }}
      >
        <span role="img" aria-hidden="true" className="text-base">
          ⚠️
        </span>
        <h3
          className="font-semibold text-sm sm:text-base"
          style={{ color: '#7a5a14' }}
        >
          包裝注意事項
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
                  idx > 0 ? '1px solid rgba(180, 140, 40, 0.12)' : 'none',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span role="img" aria-hidden="true" className="text-sm">
                  {icon}
                </span>
                <span
                  className="text-xs sm:text-sm font-medium"
                  style={{ color: '#7a5a14' }}
                >
                  {label}
                </span>
                <span className="text-xs" style={{ color: '#a07d2c' }}>
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
                    style={{ color: '#a07d2c' }}
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
          background: '#fef9ec',
          color: '#a07d2c',
          borderTop: '1px solid rgba(180, 140, 40, 0.12)',
        }}
      >
        以包裝實際標示為準
      </footer>
    </section>
  )
}

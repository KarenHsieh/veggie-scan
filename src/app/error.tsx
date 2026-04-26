'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 sm:px-8"
      style={{ background: 'var(--color-cream)' }}
    >
      <div className="text-center space-y-5 max-w-md animate-fadeInUp">
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--color-terracotta-light)' }}
        >
          <span className="text-2xl">⚠️</span>
        </div>
        <h2
          className="text-xl sm:text-2xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-charcoal)' }}
        >
          發生錯誤
        </h2>
        <p className="text-sm sm:text-base" style={{ color: 'var(--color-warm-gray)' }}>
          {error.message || '系統發生未預期的錯誤，請重試'}
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 rounded-xl font-medium text-sm text-white transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
          style={{ background: 'var(--color-sage)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-sage-dark)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-sage)')}
        >
          重新載入
        </button>
      </div>
    </div>
  )
}

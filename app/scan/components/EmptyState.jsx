import Link from 'next/link'

export default function EmptyState({ 
  icon = '📋', 
  title = '尚無資料', 
  message = '開始上傳圖片或輸入成分文字',
  actionText = null,
  actionHref = null,
  onAction = null
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-12">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        {/* 圖示 */}
        <div className="text-6xl mb-2">{icon}</div>

        {/* 標題 */}
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>

        {/* 訊息 */}
        <p className="text-gray-600 max-w-md">{message}</p>

        {/* 操作按鈕（可選） */}
        {actionText && (
          <>
            {actionHref ? (
              <Link
                href={actionHref}
                className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                {actionText}
              </Link>
            ) : onAction ? (
              <button
                onClick={onAction}
                className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                {actionText}
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

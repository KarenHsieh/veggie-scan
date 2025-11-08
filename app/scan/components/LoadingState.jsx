export default function LoadingState({ message = '處理中...', progress = null }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-12">
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Loading 動畫 */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
        </div>

        {/* 訊息 */}
        <p className="text-lg font-semibold text-gray-700">{message}</p>

        {/* 進度條（可選） */}
        {progress !== null && (
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>進度</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

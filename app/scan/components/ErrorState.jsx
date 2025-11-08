export default function ErrorState({ 
  error = '發生錯誤',
  message = '請稍後再試',
  onRetry = null,
  onReset = null
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-12">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        {/* 錯誤圖示 */}
        <div className="text-6xl mb-2">⚠️</div>

        {/* 錯誤標題 */}
        <h3 className="text-xl font-bold text-red-700">{error}</h3>

        {/* 錯誤訊息 */}
        <p className="text-gray-600 max-w-md">{message}</p>

        {/* 操作按鈕 */}
        <div className="flex gap-3 mt-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              重試
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              返回
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

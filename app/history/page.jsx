'use client'

import Link from 'next/link'

export default function HistoryPage() {
  // TODO: 從 localStorage 讀取歷史記錄
  const history = []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            🥬 VeggieScan
          </Link>
          <Link 
            href="/scan" 
            className="text-gray-600 hover:text-primary-600 transition-colors"
          >
            返回掃描
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              查詢歷史
            </h1>
            <p className="text-gray-600">
              最近 10 筆查詢記錄
            </p>
          </div>

          {/* History List */}
          {history.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 mb-4">尚無查詢記錄</p>
              <Link
                href="/scan"
                className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                開始第一次掃描
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  {/* TODO: 顯示歷史記錄內容 */}
                  <p>歷史記錄 {index + 1}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

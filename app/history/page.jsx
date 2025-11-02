'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getHistory, deleteHistory, clearHistory, formatTimestamp } from '../../lib/storage/history'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const router = useRouter()

  useEffect(() => {
    // 載入歷史記錄
    setHistory(getHistory())
  }, [])

  const handleDelete = (id) => {
    if (confirm('確定要刪除這筆記錄嗎？')) {
      deleteHistory(id)
      setHistory(getHistory())
    }
  }

  const handleClearAll = () => {
    if (confirm('確定要清空所有歷史記錄嗎？')) {
      clearHistory()
      setHistory([])
    }
  }

  const handleReanalyze = (text) => {
    // 將文字帶回掃描頁面
    router.push(`/scan?text=${encodeURIComponent(text)}`)
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                查詢歷史
              </h1>
              <p className="text-gray-600">
                最近 10 筆查詢記錄
              </p>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                清空全部
              </button>
            )}
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
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* 左側：結果圖示與摘要 */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-4xl">{item.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">
                          {formatTimestamp(item.timestamp)}
                        </p>
                        <p className="text-gray-700 mb-2">{item.summary}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.text}
                        </p>
                      </div>
                    </div>

                    {/* 右側：操作按鈕 */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleReanalyze(item.text)}
                        className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
                      >
                        重新分析
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

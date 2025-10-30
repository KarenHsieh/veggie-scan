'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo & Title */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-primary-600">
            🥬 VeggieScan
          </h1>
          <p className="text-xl text-gray-600">
            素食掃描識別器
          </p>
          <p className="text-gray-500">
            讓素食者與關心成分的人，在任何國家都能安心購物
          </p>
        </div>

        {/* CTA Button */}
        <div className="space-y-4">
          <button
            onClick={() => router.push('/scan')}
            className="w-full max-w-md px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
          >
            開始掃描
          </button>
          
          <p className="text-sm text-gray-400">
            上傳食品標籤照片，立即判斷是否適合素食
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="text-3xl mb-2">📸</div>
            <h3 className="font-semibold mb-2">快速辨識</h3>
            <p className="text-sm text-gray-600">
              上傳照片或貼上文字即可分析
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-semibold mb-2">精準判斷</h3>
            <p className="text-sm text-gray-600">
              比對成分資料庫，提供詳細說明
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="text-3xl mb-2">💾</div>
            <h3 className="font-semibold mb-2">歷史紀錄</h3>
            <p className="text-sm text-gray-600">
              保存查詢記錄，方便再次查看
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

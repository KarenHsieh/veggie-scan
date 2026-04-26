'use client'

import { useState, useCallback } from 'react'
import ImageUploader from '@/components/ImageUploader'
import ImageCropper from '@/components/ImageCropper'
import TextInput from '@/components/TextInput'
import OcrReview from '@/components/OcrReview'
import ResultDisplay from '@/components/ResultDisplay'
import type { ClassifiedIngredient } from '@/types/ingredients'

type InputMode = 'image' | 'text'
type AppState = 'input' | 'cropping' | 'ocr-loading' | 'ocr-review' | 'analyzing' | 'result' | 'error'

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>('image')
  const [textInput, setTextInput] = useState('')
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState('')
  const [appState, setAppState] = useState<AppState>('input')
  const [ingredients, setIngredients] = useState<ClassifiedIngredient[]>([])
  const [error, setError] = useState<string | null>(null)

  const switchMode = useCallback((mode: InputMode) => {
    setInputMode(mode)
    setTextInput('')
    setImageBase64(null)
    setOcrText('')
    setError(null)
    setAppState('input')
  }, [])

  const handleImageSelected = useCallback((base64: string) => {
    setImageBase64(base64)
    setAppState('cropping')
  }, [])

  const handleOcr = useCallback(async (base64: string) => {
    setAppState('ocr-loading')
    setError(null)
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'OCR 辨識失敗')
      }
      const data = await res.json()
      setOcrText(data.text)
      setAppState('ocr-review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR 辨識失敗，請重試')
      setAppState('error')
    }
  }, [])

  const handleAnalyze = useCallback(async (text: string) => {
    setAppState('analyzing')
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '成分分析失敗')
      }
      const data = await res.json()
      setIngredients(data.ingredients)
      setAppState('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '成分分析失敗，請重試')
      setAppState('error')
    }
  }, [])

  const handleCropConfirm = useCallback((croppedBase64: string) => {
    handleOcr(croppedBase64)
  }, [handleOcr])

  const handleCropCancel = useCallback(() => {
    setImageBase64(null)
    setAppState('input')
  }, [])

  const handleClear = useCallback(() => {
    setAppState('input')
    setTextInput('')
    setImageBase64(null)
    setOcrText('')
    setIngredients([])
    setError(null)
  }, [])

  const isLoading = appState === 'ocr-loading' || appState === 'analyzing'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Decorative Header Bar */}
      <header className="w-full border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-5 sm:py-6 flex items-center gap-4">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-sage)', color: '#fff' }}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.5 3-5 5-5 9a5 5 0 0010 0c0-4-3.5-6-5-9z" />
            </svg>
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-sage-dark)' }}
            >
              VeggieScan
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-warm-gray)' }}>
              素食成分掃描辨識
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-8 py-6 sm:py-10 lg:py-12">
        {/* Result State */}
        {appState === 'result' && (
          <div className="animate-fadeInUp">
            <ResultDisplay ingredients={ingredients} onClear={handleClear} />
          </div>
        )}

        {/* Cropping State */}
        {appState === 'cropping' && imageBase64 && (
          <div className="animate-scaleIn">
            <ImageCropper
              imageSrc={imageBase64}
              onCropComplete={handleCropConfirm}
              onCancel={handleCropCancel}
            />
          </div>
        )}

        {/* OCR Review State */}
        {appState === 'ocr-review' && (
          <div className="animate-fadeInUp">
            <OcrReview
              initialText={ocrText}
              onConfirm={handleAnalyze}
              onRescan={() => {
                setAppState('input')
                setOcrText('')
              }}
            />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 sm:py-28 animate-fadeIn">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-full border-[3px] border-t-transparent"
                style={{
                  borderColor: 'var(--color-sage-light)',
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div
                className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-t-transparent opacity-40"
                style={{
                  borderColor: 'transparent',
                  borderTopColor: 'var(--color-sage)',
                  animation: 'spin 0.8s linear infinite reverse',
                }}
              />
            </div>
            <p className="text-sm mt-6 animate-gentlePulse" style={{ color: 'var(--color-warm-gray)' }}>
              {appState === 'ocr-loading' ? '正在辨識圖片文字⋯' : '正在分析成分⋯'}
            </p>
          </div>
        )}

        {/* Error State */}
        {appState === 'error' && (
          <div className="space-y-5 animate-fadeInUp max-w-lg mx-auto">
            <div
              className="rounded-2xl p-5 sm:p-6 border"
              style={{ background: 'var(--color-terracotta-light)', borderColor: 'rgba(196, 97, 58, 0.2)' }}
            >
              <p className="text-sm" style={{ color: 'var(--color-terracotta)' }}>{error}</p>
            </div>
            <button
              onClick={handleClear}
              className="w-full py-3 rounded-xl font-medium text-sm transition-all duration-200 border hover:shadow-sm active:scale-[0.98]"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-charcoal)',
                background: 'white',
              }}
            >
              重新開始
            </button>
          </div>
        )}

        {/* Input State */}
        {appState === 'input' && (
          <div className="space-y-8 animate-fadeInUp">
            {/* Mode Switcher */}
            <div
              className="flex p-1 rounded-xl sm:max-w-xs"
              style={{ background: 'var(--color-cream-deep)' }}
            >
              <button
                onClick={() => switchMode('image')}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
                style={{
                  background: inputMode === 'image' ? 'white' : 'transparent',
                  color: inputMode === 'image' ? 'var(--color-sage-dark)' : 'var(--color-warm-gray)',
                  boxShadow: inputMode === 'image' ? 'var(--shadow-soft)' : 'none',
                }}
              >
                拍照掃描
              </button>
              <button
                onClick={() => switchMode('text')}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
                style={{
                  background: inputMode === 'text' ? 'white' : 'transparent',
                  color: inputMode === 'text' ? 'var(--color-sage-dark)' : 'var(--color-warm-gray)',
                  boxShadow: inputMode === 'text' ? 'var(--shadow-soft)' : 'none',
                }}
              >
                手動輸入
              </button>
            </div>

            {/* Input Area */}
            <div className="sm:grid sm:grid-cols-1 lg:grid-cols-[1fr] gap-6">
              {inputMode === 'image' ? (
                <ImageUploader
                  onImageSelected={handleImageSelected}
                  disabled={isLoading}
                />
              ) : (
                <div className="space-y-4">
                  <TextInput
                    value={textInput}
                    onChange={setTextInput}
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleAnalyze(textInput.trim())}
                    disabled={isLoading || !textInput.trim()}
                    className="w-full sm:w-auto sm:px-10 py-3.5 rounded-xl font-medium text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
                    style={{ background: 'var(--color-sage)' }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = 'var(--color-sage-dark)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-sage)')}
                  >
                    開始分析
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="w-full border-t py-4 sm:py-5"
        style={{ borderColor: 'var(--color-border-light)' }}
      >
        <p className="text-center text-xs" style={{ color: 'var(--color-warm-gray-light)' }}>
          VeggieScan — 讓素食生活更簡單
        </p>
      </footer>
    </div>
  )
}

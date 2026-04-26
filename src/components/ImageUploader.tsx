'use client'

import { useCallback, useRef, useState } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void
  disabled?: boolean
}

export default function ImageUploader({ onImageSelected, disabled }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((file: File) => {
    setError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('請上傳 JPEG、PNG 或 WebP 格式的圖片')
      return
    }

    if (file.size > MAX_SIZE) {
      setError('圖片大小不可超過 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setPreview(base64)
      onImageSelected(base64)
    }
    reader.readAsDataURL(file)
  }, [onImageSelected])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className="group relative rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 border-2 border-dashed overflow-hidden"
        style={{
          borderColor: isDragging ? 'var(--color-sage)' : 'var(--color-border)',
          background: isDragging ? 'var(--color-sage-mist)' : 'white',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {/* Hover background effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, var(--color-sage-mist), transparent 60%)' }}
        />

        <div className="relative z-10">
          {preview ? (
            <img src={preview} alt="預覽" className="max-h-48 sm:max-h-72 mx-auto rounded-xl" style={{ boxShadow: 'var(--shadow-card)' }} />
          ) : (
            <div>
              <div
                className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 transition-transform duration-300 group-hover:scale-105"
                style={{ background: 'var(--color-sage-mist)' }}
              >
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.3}
                  style={{ color: 'var(--color-sage)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-medium text-sm sm:text-base" style={{ color: 'var(--color-charcoal)' }}>
                拍照或上傳食品成分表圖片
              </p>
              <p className="text-xs sm:text-sm mt-1.5" style={{ color: 'var(--color-warm-gray-light)' }}>
                支援 JPEG、PNG、WebP（最大 10MB）
              </p>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
      </div>
      {error && (
        <p className="text-sm" style={{ color: 'var(--color-terracotta)' }}>{error}</p>
      )}
    </div>
  )
}

'use client'

import { useState, useCallback, useRef } from 'react'
import Cropper, { type ReactCropperElement } from 'react-cropper'
import 'cropperjs/dist/cropper.css'

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedBase64: string) => void
  onCancel: () => void
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const cropperRef = useRef<ReactCropperElement>(null)
  const [processing, setProcessing] = useState(false)

  const handleConfirm = useCallback(() => {
    const cropper = cropperRef.current?.cropper
    if (!cropper) return
    setProcessing(true)
    try {
      const canvas = cropper.getCroppedCanvas()
      const base64 = canvas.toDataURL('image/jpeg', 0.9)
      onCropComplete(base64)
    } catch {
      setProcessing(false)
    }
  }, [onCropComplete])

  return (
    <div className="space-y-5">
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          height: 'clamp(280px, 50vh, 480px)',
          background: '#1a1a1a',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <Cropper
          ref={cropperRef}
          src={imageSrc}
          style={{ height: '100%', width: '100%' }}
          viewMode={1}
          guides={false}
          background={false}
          responsive
          autoCropArea={0.85}
          checkOrientation={false}
        />
      </div>
      <p className="text-xs sm:text-sm text-center" style={{ color: 'var(--color-warm-gray)' }}>
        拖曳裁切框邊緣自由調整範圍，雙指縮放圖片
      </p>
      <div className="flex gap-3 sm:gap-4">
        <button
          onClick={handleConfirm}
          disabled={processing}
          className="flex-1 py-3 px-5 rounded-xl font-medium text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
          style={{ background: 'var(--color-sage)' }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = 'var(--color-sage-dark)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-sage)')}
        >
          {processing ? '裁切中⋯' : '確認裁切'}
        </button>
        <button
          onClick={onCancel}
          disabled={processing}
          className="py-3 px-5 rounded-xl font-medium text-sm transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm active:scale-[0.98]"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-charcoal)',
            background: 'white',
          }}
        >
          取消
        </button>
      </div>
    </div>
  )
}

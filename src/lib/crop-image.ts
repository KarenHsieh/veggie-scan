export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export async function cropImage(imageSrc: string, cropAreaPixels: CropArea): Promise<string> {
  const image = new Image()
  image.src = imageSrc

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Failed to load image for cropping'))
  })

  const canvas = document.createElement('canvas')
  canvas.width = cropAreaPixels.width
  canvas.height = cropAreaPixels.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.drawImage(
    image,
    cropAreaPixels.x, cropAreaPixels.y, cropAreaPixels.width, cropAreaPixels.height,
    0, 0, cropAreaPixels.width, cropAreaPixels.height
  )

  return canvas.toDataURL('image/jpeg', 0.9)
}

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cropImage, type CropArea } from './crop-image'

const mockContext = {
  drawImage: vi.fn(),
}

const mockCanvas = {
  getContext: vi.fn(() => mockContext),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,cropped'),
  width: 0,
  height: 0,
}

beforeEach(() => {
  vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement)
  // Mock Image to fire onload synchronously
  vi.stubGlobal('Image', class {
    src = ''
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set _src(val: string) { this.src = val }
    constructor() {
      setTimeout(() => this.onload?.(), 0)
    }
  })
  mockCanvas.width = 0
  mockCanvas.height = 0
  vi.clearAllMocks()
})

describe('cropImage', () => {
  it('creates a canvas with the crop area dimensions', async () => {
    const cropArea = { x: 10, y: 20, width: 100, height: 50 }

    await cropImage('data:image/jpeg;base64,abc', cropArea)

    expect(mockCanvas.width).toBe(100)
    expect(mockCanvas.height).toBe(50)
  })

  it('draws the source image offset by the crop coordinates', async () => {
    const cropArea = { x: 10, y: 20, width: 100, height: 50 }

    await cropImage('data:image/jpeg;base64,abc', cropArea)

    expect(mockContext.drawImage).toHaveBeenCalledWith(
      expect.any(Object),
      10, 20, 100, 50,
      0, 0, 100, 50
    )
  })

  it('returns a base64 data URL from the canvas', async () => {
    const cropArea = { x: 0, y: 0, width: 50, height: 50 }

    const result = await cropImage('data:image/jpeg;base64,abc', cropArea)

    expect(result).toBe('data:image/jpeg;base64,cropped')
  })

  it('throws if canvas context is unavailable', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCanvas.getContext.mockReturnValueOnce(null as any)
    const cropArea = { x: 0, y: 0, width: 50, height: 50 }

    await expect(cropImage('data:image/jpeg;base64,abc', cropArea)).rejects.toThrow('Failed to get canvas context')
  })
})

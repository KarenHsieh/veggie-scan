## Context

VeggieScan's current image flow is: select photo → send full image to Gemini OCR → user reviews text → analyze. The app state machine in `page.tsx` manages transitions between `input`, `ocr-loading`, `ocr-review`, `analyzing`, `result`, and `error` states. Images are stored as base64 data URLs in component state.

The `ImageUploader` component handles file selection, validation (type + size), and preview. It calls `onImageSelected(base64)` which stores the full image in `page.tsx` state. When the user clicks "開始分析", the full base64 image is sent to `/api/ocr`.

## Goals / Non-Goals

**Goals:**

- Let users visually crop to the ingredient label area before OCR
- Support mobile touch gestures (pinch zoom, drag to pan)
- Produce a cropped image client-side and send only that to OCR
- Maintain the existing flow for users who don't need to crop (e.g., well-framed photos)

**Non-Goals:**

- Server-side image processing or resizing
- Image enhancement (contrast, sharpness, rotation correction)
- Auto-detection of ingredient label regions
- Persisting or caching cropped images

## Decisions

### Use react-easy-crop for the crop UI

**Choice:** `react-easy-crop` over `react-image-crop` or `react-cropper`.

**Rationale:** This is a mobile-first app (users photograph food packaging while shopping). `react-easy-crop` has built-in pinch-to-zoom and drag-to-pan gesture support, which is critical for the use case. It's lightweight (~10KB gzipped) with no sub-dependencies. MIT licensed.

**Alternatives:**
- `react-image-crop`: No built-in touch gesture support; would need additional gesture handling
- `react-cropper` (Cropper.js wrapper): Much heavier bundle (~40KB+), overkill for a single crop operation

### Add a new `cropping` state to the app state machine

**Choice:** Insert a `cropping` state between `input` and `ocr-loading`.

**Updated flow:**
```
input → cropping → ocr-loading → ocr-review → analyzing → result
```

**Rationale:** Keeps the state machine explicit and allows clean transitions. The "開始分析" button in `input` state triggers the transition to `cropping` (when in image mode). From `cropping`, the user confirms the crop area, which triggers OCR with the cropped image.

### Use HTML Canvas to produce the cropped image

**Choice:** Use an offscreen `<canvas>` element to extract the cropped region as a base64 data URL.

**Rationale:** `react-easy-crop` outputs crop coordinates (x, y, width, height in pixels). Drawing the source image onto a canvas at those coordinates and calling `canvas.toDataURL()` produces a new base64 image of just the cropped region. This is entirely client-side with no additional dependencies. The cropped base64 replaces the original before sending to `/api/ocr`.

### Create a dedicated ImageCropper component

**Choice:** New component `src/components/ImageCropper.tsx` encapsulating the crop UI and canvas logic.

**Props:**
- `imageSrc: string` — the original base64 image
- `onCropComplete: (croppedBase64: string) => void` — callback with cropped result
- `onCancel: () => void` — return to image selection

**Rationale:** Keeps crop logic isolated from `ImageUploader` (which handles file selection/validation) and from `page.tsx` (which manages the state machine). Single responsibility.

## Risks / Trade-offs

- **Large images may slow canvas cropping** → Acceptable for typical phone photos (3-5MB). The 10MB upload limit already constrains this. Canvas operations on images this size complete in <100ms on modern devices.
- **Added step in the flow** → Users must tap one extra button. Mitigated by keeping the crop UI simple with clear confirm/cancel actions. The time saved on OCR text editing more than compensates.
- **New dependency** → `react-easy-crop` is a single, well-maintained package with no transitive dependencies. Low supply-chain risk.

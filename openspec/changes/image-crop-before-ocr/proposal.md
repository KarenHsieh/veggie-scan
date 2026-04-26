## Why

Users often capture photos of entire food packaging, which includes nutritional info, marketing text, barcodes, and other irrelevant content alongside the ingredient list. The current flow sends the full image to OCR, then expects users to manually delete unwanted text line by line — most users won't have the patience for this. Adding an image cropping step before OCR lets users visually select just the ingredient label area, resulting in cleaner OCR output and a better user experience.

## What Changes

- Add a cropping step between image selection and OCR submission
- After selecting/capturing a photo, users enter a crop UI where they can pan, zoom, and select the ingredient label region
- Only the cropped region is sent to the OCR API, reducing noise and improving accuracy
- Install `react-easy-crop` as a dependency for mobile-friendly crop interactions (pinch zoom, drag)
- The existing "開始分析" button flow is updated: image select → crop → OCR → review → analyze

## Capabilities

### New Capabilities

- `image-crop`: Client-side image cropping UI that allows users to select a region of interest from a food packaging photo before OCR processing. Supports touch gestures (pinch zoom, drag) for mobile use.

### Modified Capabilities

(none)

## Impact

- Affected code:
  - `src/components/ImageUploader.tsx` — may need to pass uncropped image to crop step
  - `src/app/page.tsx` — new state for crop step in the app state machine
  - New component: `src/components/ImageCropper.tsx`
- New dependency: `react-easy-crop`
- No backend changes required — the cropped image is produced client-side before being sent to the existing `/api/ocr` endpoint

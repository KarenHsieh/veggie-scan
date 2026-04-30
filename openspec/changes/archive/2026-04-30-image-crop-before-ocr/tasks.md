## 1. Setup

- [x] 1.1 Install `react-easy-crop` dependency — use react-easy-crop for the crop UI per design decision

## 2. ImageCropper Component

- [x] 2.1 Create a dedicated ImageCropper component at `src/components/ImageCropper.tsx` with crop UI display: render `react-easy-crop`'s `Cropper` component with the source image, free aspect ratio cropping (no fixed aspect constraint), and pan and zoom gestures support (drag-to-pan, pinch-to-zoom on mobile, scroll-to-zoom on desktop)
- [x] 2.2 Implement client-side crop image generation: use HTML Canvas to produce the cropped image — on confirm, draw the selected crop area onto an offscreen canvas and export as base64 data URL
- [x] 2.3 Add confirm and cancel buttons — confirm calls `onCropComplete(croppedBase64)`, cancel crop returns to image selection by calling `onCancel()`

## 3. App State Machine Integration

- [x] 3.1 Implement crop state in app state machine: add a new `cropping` state to the app state machine in `src/app/page.tsx`, placing it between `input` and `ocr-loading`
- [x] 3.2 Update `ImageUploader` so that when user selects an image, the app transitions to `cropping` state (state transition from input to cropping) instead of storing the image and waiting for "開始分析"
- [x] 3.3 Render `ImageCropper` when `appState === 'cropping'`, passing the selected image. On confirm, transition from cropping to OCR (`ocr-loading`) with the cropped image. On cancel, return to `input` state and discard the image.
- [x] 3.4 Remove the "開始分析" button requirement for image mode since the flow now goes directly from image selection to cropping to OCR

## 4. Testing

- [x] 4.1 Manually verify the full image-mode flow: select image → crop UI appears → pan and zoom gestures work → confirm crop → OCR runs on cropped image → review → analyze
- [x] 4.2 Verify cancel crop returns to image selection with no residual state
- [x] 4.3 Verify text input mode is unaffected by the state machine changes

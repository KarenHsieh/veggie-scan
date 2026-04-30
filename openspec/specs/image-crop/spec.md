# image-crop Specification

## Purpose

TBD - created by archiving change 'image-crop-before-ocr'. Update Purpose after archive.

## Requirements

### Requirement: Crop UI display

After selecting or capturing an image, the system SHALL present a crop interface that displays the full image and allows the user to select a rectangular region of interest.

#### Scenario: Crop UI appears after image selection

- **WHEN** user selects or captures a photo in image input mode
- **THEN** the system SHALL display the crop interface with the full image loaded

#### Scenario: Crop UI shows confirm and cancel actions

- **WHEN** the crop interface is displayed
- **THEN** the system SHALL show a confirm button to proceed with the cropped area and a cancel button to return to image selection


<!-- @trace
source: image-crop-before-ocr
updated: 2026-04-30
code:
  - lib/rules/explain.js
  - src/lib/verdict.ts
  - tailwind.config.js
  - postcss.config.js
  - tsconfig.json
  - src/lib/crop-image.ts
  - lib/storage/history.js
  - src/components/ResultDisplay.tsx
  - app/api/classify/route.js
  - Dockerfile
  - app/scan/components/ResultCard.jsx
  - CLAUDE.md
  - src/lib/rate-limit.ts
  - src/data/ingredients.json
  - public/file.svg
  - lib/ocr/index.js
  - public/vercel.svg
  - app/api/health/route.js
  - src/components/IngredientGroup.tsx
  - README.md
  - src/components/TextInput.tsx
  - src/app/layout.tsx
  - app/layout.jsx
  - public/next.svg
  - .spectra.yaml
  - package.json
  - src/components/OcrReview.tsx
  - server/controllers/filterIngredientsController.js
  - src/lib/ocr.ts
  - lib/rules/classify.js
  - next.config.ts
  - public/globe.svg
  - app/scan/page.jsx
  - lib/ocr/cloudVision.js
  - public/window.svg
  - app/page.jsx
  - app/api/filter-ingredients/route.js
  - app/history/page.jsx
  - lib/text/tokenize.js
  - src/app/api/parse/route.ts
  - src/types/ingredients.ts
  - data/blacklists.json
  - data/ingredients.base.json
  - tests/text/manual-test.js
  - lib/text/normalize.js
  - src/lib/ingredient-matcher.ts
  - data/e-codes.json
  - src/app/favicon.ico
  - playwright.config.js
  - eslint.config.mjs
  - src/app/api/ocr/route.ts
  - app/scan/components/EmptyState.jsx
  - .env.example
  - src/app/globals.css
  - src/components/ImageUploader.tsx
  - src/app/page.tsx
  - lib/ai/geminiFilter.js
  - app/scan/components/UploadArea.jsx
  - src/components/ImageCropper.tsx
  - data/whitelists.json
  - src/app/error.tsx
  - lib/utils/filterNonIngredients.js
  - app/api/ocr/route.js
  - postcss.config.mjs
  - src/components/VegetarianTypeSwitcher.tsx
  - lib/storage/aiJudgeCache.js
  - app/globals.css
  - lib/ocr/tesseract.js
  - app/scan/components/ErrorState.jsx
  - src/components/VerdictBanner.tsx
  - lib/ai/geminiJudge.js
  - src/lib/classifier.ts
  - src/lib/parser.ts
  - vitest.config.js
  - src/app/api/analyze/route.ts
  - vitest.config.ts
  - data/stopwords.packaging.json
  - app/scan/components/LoadingState.jsx
  - src/lib/gemini.ts
tests:
  - tests/text/normalize.test.js
  - tests/utils/filterNonIngredients.test.js
  - src/lib/rate-limit.test.ts
  - tests/rules/classify.test.js
  - tests/text/tokenize-separator.test.js
  - tests/ocr/tesseract.test.js
  - src/lib/crop-image.test.ts
  - src/lib/verdict.test.ts
  - tests/rules/five-pungent.test.js
  - tests/rules/explain.test.js
  - tests/text/tokenize.test.js
  - src/lib/ingredient-matcher.test.ts
  - tests/e2e/happy-path.spec.js
  - tests/e2e/ai-filter.spec.js
-->

---
### Requirement: Pan and zoom gestures

The crop interface SHALL support drag-to-pan and pinch-to-zoom gestures on touch devices, and drag-to-pan and scroll-to-zoom on desktop.

#### Scenario: User zooms in on mobile

- **WHEN** user performs a pinch-to-zoom gesture on the crop interface
- **THEN** the image SHALL zoom in or out following the gesture

#### Scenario: User pans the image

- **WHEN** user drags the image within the crop interface
- **THEN** the visible region SHALL pan to follow the drag direction


<!-- @trace
source: image-crop-before-ocr
updated: 2026-04-30
code:
  - lib/rules/explain.js
  - src/lib/verdict.ts
  - tailwind.config.js
  - postcss.config.js
  - tsconfig.json
  - src/lib/crop-image.ts
  - lib/storage/history.js
  - src/components/ResultDisplay.tsx
  - app/api/classify/route.js
  - Dockerfile
  - app/scan/components/ResultCard.jsx
  - CLAUDE.md
  - src/lib/rate-limit.ts
  - src/data/ingredients.json
  - public/file.svg
  - lib/ocr/index.js
  - public/vercel.svg
  - app/api/health/route.js
  - src/components/IngredientGroup.tsx
  - README.md
  - src/components/TextInput.tsx
  - src/app/layout.tsx
  - app/layout.jsx
  - public/next.svg
  - .spectra.yaml
  - package.json
  - src/components/OcrReview.tsx
  - server/controllers/filterIngredientsController.js
  - src/lib/ocr.ts
  - lib/rules/classify.js
  - next.config.ts
  - public/globe.svg
  - app/scan/page.jsx
  - lib/ocr/cloudVision.js
  - public/window.svg
  - app/page.jsx
  - app/api/filter-ingredients/route.js
  - app/history/page.jsx
  - lib/text/tokenize.js
  - src/app/api/parse/route.ts
  - src/types/ingredients.ts
  - data/blacklists.json
  - data/ingredients.base.json
  - tests/text/manual-test.js
  - lib/text/normalize.js
  - src/lib/ingredient-matcher.ts
  - data/e-codes.json
  - src/app/favicon.ico
  - playwright.config.js
  - eslint.config.mjs
  - src/app/api/ocr/route.ts
  - app/scan/components/EmptyState.jsx
  - .env.example
  - src/app/globals.css
  - src/components/ImageUploader.tsx
  - src/app/page.tsx
  - lib/ai/geminiFilter.js
  - app/scan/components/UploadArea.jsx
  - src/components/ImageCropper.tsx
  - data/whitelists.json
  - src/app/error.tsx
  - lib/utils/filterNonIngredients.js
  - app/api/ocr/route.js
  - postcss.config.mjs
  - src/components/VegetarianTypeSwitcher.tsx
  - lib/storage/aiJudgeCache.js
  - app/globals.css
  - lib/ocr/tesseract.js
  - app/scan/components/ErrorState.jsx
  - src/components/VerdictBanner.tsx
  - lib/ai/geminiJudge.js
  - src/lib/classifier.ts
  - src/lib/parser.ts
  - vitest.config.js
  - src/app/api/analyze/route.ts
  - vitest.config.ts
  - data/stopwords.packaging.json
  - app/scan/components/LoadingState.jsx
  - src/lib/gemini.ts
tests:
  - tests/text/normalize.test.js
  - tests/utils/filterNonIngredients.test.js
  - src/lib/rate-limit.test.ts
  - tests/rules/classify.test.js
  - tests/text/tokenize-separator.test.js
  - tests/ocr/tesseract.test.js
  - src/lib/crop-image.test.ts
  - src/lib/verdict.test.ts
  - tests/rules/five-pungent.test.js
  - tests/rules/explain.test.js
  - tests/text/tokenize.test.js
  - src/lib/ingredient-matcher.test.ts
  - tests/e2e/happy-path.spec.js
  - tests/e2e/ai-filter.spec.js
-->

---
### Requirement: Free aspect ratio cropping

The crop interface SHALL allow the user to select a crop area without a fixed aspect ratio constraint, since ingredient label regions vary in shape.

#### Scenario: User selects a tall narrow region

- **WHEN** user adjusts the crop area to a tall narrow rectangle
- **THEN** the system SHALL accept the selection without enforcing a fixed aspect ratio

#### Scenario: User selects a wide short region

- **WHEN** user adjusts the crop area to a wide short rectangle
- **THEN** the system SHALL accept the selection without enforcing a fixed aspect ratio


<!-- @trace
source: image-crop-before-ocr
updated: 2026-04-30
code:
  - lib/rules/explain.js
  - src/lib/verdict.ts
  - tailwind.config.js
  - postcss.config.js
  - tsconfig.json
  - src/lib/crop-image.ts
  - lib/storage/history.js
  - src/components/ResultDisplay.tsx
  - app/api/classify/route.js
  - Dockerfile
  - app/scan/components/ResultCard.jsx
  - CLAUDE.md
  - src/lib/rate-limit.ts
  - src/data/ingredients.json
  - public/file.svg
  - lib/ocr/index.js
  - public/vercel.svg
  - app/api/health/route.js
  - src/components/IngredientGroup.tsx
  - README.md
  - src/components/TextInput.tsx
  - src/app/layout.tsx
  - app/layout.jsx
  - public/next.svg
  - .spectra.yaml
  - package.json
  - src/components/OcrReview.tsx
  - server/controllers/filterIngredientsController.js
  - src/lib/ocr.ts
  - lib/rules/classify.js
  - next.config.ts
  - public/globe.svg
  - app/scan/page.jsx
  - lib/ocr/cloudVision.js
  - public/window.svg
  - app/page.jsx
  - app/api/filter-ingredients/route.js
  - app/history/page.jsx
  - lib/text/tokenize.js
  - src/app/api/parse/route.ts
  - src/types/ingredients.ts
  - data/blacklists.json
  - data/ingredients.base.json
  - tests/text/manual-test.js
  - lib/text/normalize.js
  - src/lib/ingredient-matcher.ts
  - data/e-codes.json
  - src/app/favicon.ico
  - playwright.config.js
  - eslint.config.mjs
  - src/app/api/ocr/route.ts
  - app/scan/components/EmptyState.jsx
  - .env.example
  - src/app/globals.css
  - src/components/ImageUploader.tsx
  - src/app/page.tsx
  - lib/ai/geminiFilter.js
  - app/scan/components/UploadArea.jsx
  - src/components/ImageCropper.tsx
  - data/whitelists.json
  - src/app/error.tsx
  - lib/utils/filterNonIngredients.js
  - app/api/ocr/route.js
  - postcss.config.mjs
  - src/components/VegetarianTypeSwitcher.tsx
  - lib/storage/aiJudgeCache.js
  - app/globals.css
  - lib/ocr/tesseract.js
  - app/scan/components/ErrorState.jsx
  - src/components/VerdictBanner.tsx
  - lib/ai/geminiJudge.js
  - src/lib/classifier.ts
  - src/lib/parser.ts
  - vitest.config.js
  - src/app/api/analyze/route.ts
  - vitest.config.ts
  - data/stopwords.packaging.json
  - app/scan/components/LoadingState.jsx
  - src/lib/gemini.ts
tests:
  - tests/text/normalize.test.js
  - tests/utils/filterNonIngredients.test.js
  - src/lib/rate-limit.test.ts
  - tests/rules/classify.test.js
  - tests/text/tokenize-separator.test.js
  - tests/ocr/tesseract.test.js
  - src/lib/crop-image.test.ts
  - src/lib/verdict.test.ts
  - tests/rules/five-pungent.test.js
  - tests/rules/explain.test.js
  - tests/text/tokenize.test.js
  - src/lib/ingredient-matcher.test.ts
  - tests/e2e/happy-path.spec.js
  - tests/e2e/ai-filter.spec.js
-->

---
### Requirement: Client-side crop image generation

When the user confirms the crop selection, the system SHALL produce a cropped image entirely on the client side using an HTML Canvas element. The cropped image SHALL be a base64 data URL.

#### Scenario: User confirms crop

- **WHEN** user taps the confirm button on the crop interface
- **THEN** the system SHALL generate a base64 data URL containing only the pixels within the selected crop area
- **AND** the system SHALL send the cropped image to the OCR API


<!-- @trace
source: image-crop-before-ocr
updated: 2026-04-30
code:
  - lib/rules/explain.js
  - src/lib/verdict.ts
  - tailwind.config.js
  - postcss.config.js
  - tsconfig.json
  - src/lib/crop-image.ts
  - lib/storage/history.js
  - src/components/ResultDisplay.tsx
  - app/api/classify/route.js
  - Dockerfile
  - app/scan/components/ResultCard.jsx
  - CLAUDE.md
  - src/lib/rate-limit.ts
  - src/data/ingredients.json
  - public/file.svg
  - lib/ocr/index.js
  - public/vercel.svg
  - app/api/health/route.js
  - src/components/IngredientGroup.tsx
  - README.md
  - src/components/TextInput.tsx
  - src/app/layout.tsx
  - app/layout.jsx
  - public/next.svg
  - .spectra.yaml
  - package.json
  - src/components/OcrReview.tsx
  - server/controllers/filterIngredientsController.js
  - src/lib/ocr.ts
  - lib/rules/classify.js
  - next.config.ts
  - public/globe.svg
  - app/scan/page.jsx
  - lib/ocr/cloudVision.js
  - public/window.svg
  - app/page.jsx
  - app/api/filter-ingredients/route.js
  - app/history/page.jsx
  - lib/text/tokenize.js
  - src/app/api/parse/route.ts
  - src/types/ingredients.ts
  - data/blacklists.json
  - data/ingredients.base.json
  - tests/text/manual-test.js
  - lib/text/normalize.js
  - src/lib/ingredient-matcher.ts
  - data/e-codes.json
  - src/app/favicon.ico
  - playwright.config.js
  - eslint.config.mjs
  - src/app/api/ocr/route.ts
  - app/scan/components/EmptyState.jsx
  - .env.example
  - src/app/globals.css
  - src/components/ImageUploader.tsx
  - src/app/page.tsx
  - lib/ai/geminiFilter.js
  - app/scan/components/UploadArea.jsx
  - src/components/ImageCropper.tsx
  - data/whitelists.json
  - src/app/error.tsx
  - lib/utils/filterNonIngredients.js
  - app/api/ocr/route.js
  - postcss.config.mjs
  - src/components/VegetarianTypeSwitcher.tsx
  - lib/storage/aiJudgeCache.js
  - app/globals.css
  - lib/ocr/tesseract.js
  - app/scan/components/ErrorState.jsx
  - src/components/VerdictBanner.tsx
  - lib/ai/geminiJudge.js
  - src/lib/classifier.ts
  - src/lib/parser.ts
  - vitest.config.js
  - src/app/api/analyze/route.ts
  - vitest.config.ts
  - data/stopwords.packaging.json
  - app/scan/components/LoadingState.jsx
  - src/lib/gemini.ts
tests:
  - tests/text/normalize.test.js
  - tests/utils/filterNonIngredients.test.js
  - src/lib/rate-limit.test.ts
  - tests/rules/classify.test.js
  - tests/text/tokenize-separator.test.js
  - tests/ocr/tesseract.test.js
  - src/lib/crop-image.test.ts
  - src/lib/verdict.test.ts
  - tests/rules/five-pungent.test.js
  - tests/rules/explain.test.js
  - tests/text/tokenize.test.js
  - src/lib/ingredient-matcher.test.ts
  - tests/e2e/happy-path.spec.js
  - tests/e2e/ai-filter.spec.js
-->

---
### Requirement: Cancel crop returns to image selection

When the user cancels the crop, the system SHALL return to the image selection state and discard the current image.

#### Scenario: User cancels crop

- **WHEN** user taps the cancel button on the crop interface
- **THEN** the system SHALL return to the input state
- **AND** the previously selected image SHALL be discarded


<!-- @trace
source: image-crop-before-ocr
updated: 2026-04-30
code:
  - lib/rules/explain.js
  - src/lib/verdict.ts
  - tailwind.config.js
  - postcss.config.js
  - tsconfig.json
  - src/lib/crop-image.ts
  - lib/storage/history.js
  - src/components/ResultDisplay.tsx
  - app/api/classify/route.js
  - Dockerfile
  - app/scan/components/ResultCard.jsx
  - CLAUDE.md
  - src/lib/rate-limit.ts
  - src/data/ingredients.json
  - public/file.svg
  - lib/ocr/index.js
  - public/vercel.svg
  - app/api/health/route.js
  - src/components/IngredientGroup.tsx
  - README.md
  - src/components/TextInput.tsx
  - src/app/layout.tsx
  - app/layout.jsx
  - public/next.svg
  - .spectra.yaml
  - package.json
  - src/components/OcrReview.tsx
  - server/controllers/filterIngredientsController.js
  - src/lib/ocr.ts
  - lib/rules/classify.js
  - next.config.ts
  - public/globe.svg
  - app/scan/page.jsx
  - lib/ocr/cloudVision.js
  - public/window.svg
  - app/page.jsx
  - app/api/filter-ingredients/route.js
  - app/history/page.jsx
  - lib/text/tokenize.js
  - src/app/api/parse/route.ts
  - src/types/ingredients.ts
  - data/blacklists.json
  - data/ingredients.base.json
  - tests/text/manual-test.js
  - lib/text/normalize.js
  - src/lib/ingredient-matcher.ts
  - data/e-codes.json
  - src/app/favicon.ico
  - playwright.config.js
  - eslint.config.mjs
  - src/app/api/ocr/route.ts
  - app/scan/components/EmptyState.jsx
  - .env.example
  - src/app/globals.css
  - src/components/ImageUploader.tsx
  - src/app/page.tsx
  - lib/ai/geminiFilter.js
  - app/scan/components/UploadArea.jsx
  - src/components/ImageCropper.tsx
  - data/whitelists.json
  - src/app/error.tsx
  - lib/utils/filterNonIngredients.js
  - app/api/ocr/route.js
  - postcss.config.mjs
  - src/components/VegetarianTypeSwitcher.tsx
  - lib/storage/aiJudgeCache.js
  - app/globals.css
  - lib/ocr/tesseract.js
  - app/scan/components/ErrorState.jsx
  - src/components/VerdictBanner.tsx
  - lib/ai/geminiJudge.js
  - src/lib/classifier.ts
  - src/lib/parser.ts
  - vitest.config.js
  - src/app/api/analyze/route.ts
  - vitest.config.ts
  - data/stopwords.packaging.json
  - app/scan/components/LoadingState.jsx
  - src/lib/gemini.ts
tests:
  - tests/text/normalize.test.js
  - tests/utils/filterNonIngredients.test.js
  - src/lib/rate-limit.test.ts
  - tests/rules/classify.test.js
  - tests/text/tokenize-separator.test.js
  - tests/ocr/tesseract.test.js
  - src/lib/crop-image.test.ts
  - src/lib/verdict.test.ts
  - tests/rules/five-pungent.test.js
  - tests/rules/explain.test.js
  - tests/text/tokenize.test.js
  - src/lib/ingredient-matcher.test.ts
  - tests/e2e/happy-path.spec.js
  - tests/e2e/ai-filter.spec.js
-->

---
### Requirement: Crop state in app state machine

The app state machine SHALL include a `cropping` state between `input` and `ocr-loading`. When a user selects an image in image mode, the app SHALL transition to `cropping` state instead of waiting for "開始分析".

#### Scenario: State transition from input to cropping

- **WHEN** user selects or captures an image in image input mode
- **THEN** the app state SHALL transition to `cropping`

#### Scenario: State transition from cropping to OCR

- **WHEN** user confirms the crop area
- **THEN** the app state SHALL transition to `ocr-loading` and begin OCR processing with the cropped image

<!-- @trace
source: image-crop-before-ocr
updated: 2026-04-30
code:
  - lib/rules/explain.js
  - src/lib/verdict.ts
  - tailwind.config.js
  - postcss.config.js
  - tsconfig.json
  - src/lib/crop-image.ts
  - lib/storage/history.js
  - src/components/ResultDisplay.tsx
  - app/api/classify/route.js
  - Dockerfile
  - app/scan/components/ResultCard.jsx
  - CLAUDE.md
  - src/lib/rate-limit.ts
  - src/data/ingredients.json
  - public/file.svg
  - lib/ocr/index.js
  - public/vercel.svg
  - app/api/health/route.js
  - src/components/IngredientGroup.tsx
  - README.md
  - src/components/TextInput.tsx
  - src/app/layout.tsx
  - app/layout.jsx
  - public/next.svg
  - .spectra.yaml
  - package.json
  - src/components/OcrReview.tsx
  - server/controllers/filterIngredientsController.js
  - src/lib/ocr.ts
  - lib/rules/classify.js
  - next.config.ts
  - public/globe.svg
  - app/scan/page.jsx
  - lib/ocr/cloudVision.js
  - public/window.svg
  - app/page.jsx
  - app/api/filter-ingredients/route.js
  - app/history/page.jsx
  - lib/text/tokenize.js
  - src/app/api/parse/route.ts
  - src/types/ingredients.ts
  - data/blacklists.json
  - data/ingredients.base.json
  - tests/text/manual-test.js
  - lib/text/normalize.js
  - src/lib/ingredient-matcher.ts
  - data/e-codes.json
  - src/app/favicon.ico
  - playwright.config.js
  - eslint.config.mjs
  - src/app/api/ocr/route.ts
  - app/scan/components/EmptyState.jsx
  - .env.example
  - src/app/globals.css
  - src/components/ImageUploader.tsx
  - src/app/page.tsx
  - lib/ai/geminiFilter.js
  - app/scan/components/UploadArea.jsx
  - src/components/ImageCropper.tsx
  - data/whitelists.json
  - src/app/error.tsx
  - lib/utils/filterNonIngredients.js
  - app/api/ocr/route.js
  - postcss.config.mjs
  - src/components/VegetarianTypeSwitcher.tsx
  - lib/storage/aiJudgeCache.js
  - app/globals.css
  - lib/ocr/tesseract.js
  - app/scan/components/ErrorState.jsx
  - src/components/VerdictBanner.tsx
  - lib/ai/geminiJudge.js
  - src/lib/classifier.ts
  - src/lib/parser.ts
  - vitest.config.js
  - src/app/api/analyze/route.ts
  - vitest.config.ts
  - data/stopwords.packaging.json
  - app/scan/components/LoadingState.jsx
  - src/lib/gemini.ts
tests:
  - tests/text/normalize.test.js
  - tests/utils/filterNonIngredients.test.js
  - src/lib/rate-limit.test.ts
  - tests/rules/classify.test.js
  - tests/text/tokenize-separator.test.js
  - tests/ocr/tesseract.test.js
  - src/lib/crop-image.test.ts
  - src/lib/verdict.test.ts
  - tests/rules/five-pungent.test.js
  - tests/rules/explain.test.js
  - tests/text/tokenize.test.js
  - src/lib/ingredient-matcher.test.ts
  - tests/e2e/happy-path.spec.js
  - tests/e2e/ai-filter.spec.js
-->
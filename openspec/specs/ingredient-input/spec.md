# ingredient-input Specification

## Purpose

TBD - created by archiving change 'veggiescan-mvp'. Update Purpose after archive.

## Requirements

### Requirement: Image upload for OCR scanning
The system SHALL provide an image upload control that accepts photos of food packaging ingredient labels. The system SHALL NOT persist uploaded images on the server — images are processed in-memory and discarded after OCR extraction.

#### Scenario: User uploads a valid image
- **WHEN** user selects or captures a photo (JPEG, PNG, or WebP, max 10MB)
- **THEN** the system sends the image to the OCR extraction pipeline and displays a loading state

#### Scenario: User uploads an unsupported file
- **WHEN** user selects a file that is not JPEG, PNG, or WebP, or exceeds 10MB
- **THEN** the system displays an error message indicating the file type or size restriction


<!-- @trace
source: veggiescan-mvp
updated: 2026-04-30
code:
  - app/scan/page.jsx
  - vitest.config.js
  - public/file.svg
  - src/lib/gemini.ts
  - server/controllers/filterIngredientsController.js
  - lib/ocr/index.js
  - lib/text/tokenize.js
  - src/lib/verdict.ts
  - app/scan/components/LoadingState.jsx
  - lib/rules/classify.js
  - lib/utils/filterNonIngredients.js
  - lib/ocr/tesseract.js
  - lib/ai/geminiJudge.js
  - src/app/page.tsx
  - data/whitelists.json
  - Dockerfile
  - src/app/api/ocr/route.ts
  - src/components/ImageUploader.tsx
  - src/app/api/parse/route.ts
  - app/api/ocr/route.js
  - lib/ai/geminiFilter.js
  - tailwind.config.js
  - .spectra.yaml
  - src/app/layout.tsx
  - public/globe.svg
  - app/page.jsx
  - data/e-codes.json
  - src/app/error.tsx
  - lib/rules/explain.js
  - src/lib/rate-limit.ts
  - src/types/ingredients.ts
  - src/lib/ocr.ts
  - data/blacklists.json
  - src/lib/crop-image.ts
  - public/vercel.svg
  - README.md
  - app/scan/components/ResultCard.jsx
  - app/scan/components/EmptyState.jsx
  - src/lib/ingredient-matcher.ts
  - src/app/favicon.ico
  - lib/ocr/cloudVision.js
  - src/components/OcrReview.tsx
  - src/lib/classifier.ts
  - public/next.svg
  - app/api/classify/route.js
  - src/data/ingredients.json
  - data/ingredients.base.json
  - app/layout.jsx
  - CLAUDE.md
  - src/app/api/analyze/route.ts
  - src/components/ResultDisplay.tsx
  - playwright.config.js
  - src/components/TextInput.tsx
  - lib/text/normalize.js
  - app/scan/components/ErrorState.jsx
  - src/app/globals.css
  - app/globals.css
  - lib/storage/history.js
  - app/api/filter-ingredients/route.js
  - postcss.config.js
  - src/components/ImageCropper.tsx
  - src/components/IngredientGroup.tsx
  - postcss.config.mjs
  - src/components/VerdictBanner.tsx
  - public/window.svg
  - app/scan/components/UploadArea.jsx
  - eslint.config.mjs
  - package.json
  - .env.example
  - tsconfig.json
  - lib/storage/aiJudgeCache.js
  - app/api/health/route.js
  - vitest.config.ts
  - data/stopwords.packaging.json
  - next.config.ts
  - app/history/page.jsx
  - src/lib/parser.ts
  - src/components/VegetarianTypeSwitcher.tsx
  - tests/text/manual-test.js
tests:
  - tests/e2e/happy-path.spec.js
  - src/lib/rate-limit.test.ts
  - tests/e2e/ai-filter.spec.js
  - tests/text/tokenize.test.js
  - src/lib/crop-image.test.ts
  - tests/text/tokenize-separator.test.js
  - tests/rules/explain.test.js
  - tests/text/normalize.test.js
  - tests/rules/classify.test.js
  - tests/rules/five-pungent.test.js
  - src/lib/ingredient-matcher.test.ts
  - tests/utils/filterNonIngredients.test.js
  - tests/ocr/tesseract.test.js
  - src/lib/verdict.test.ts
-->

---
### Requirement: Manual text input
The system SHALL provide a textarea where users can manually type or paste food ingredient text.

#### Scenario: User enters ingredient text manually
- **WHEN** user types or pastes text into the textarea and submits
- **THEN** the system sends the text directly to the ingredient parsing pipeline, skipping OCR

#### Scenario: Empty submission
- **WHEN** user submits with no image and no text
- **THEN** the system displays a validation message prompting the user to provide input


<!-- @trace
source: veggiescan-mvp
updated: 2026-04-30
code:
  - app/scan/page.jsx
  - vitest.config.js
  - public/file.svg
  - src/lib/gemini.ts
  - server/controllers/filterIngredientsController.js
  - lib/ocr/index.js
  - lib/text/tokenize.js
  - src/lib/verdict.ts
  - app/scan/components/LoadingState.jsx
  - lib/rules/classify.js
  - lib/utils/filterNonIngredients.js
  - lib/ocr/tesseract.js
  - lib/ai/geminiJudge.js
  - src/app/page.tsx
  - data/whitelists.json
  - Dockerfile
  - src/app/api/ocr/route.ts
  - src/components/ImageUploader.tsx
  - src/app/api/parse/route.ts
  - app/api/ocr/route.js
  - lib/ai/geminiFilter.js
  - tailwind.config.js
  - .spectra.yaml
  - src/app/layout.tsx
  - public/globe.svg
  - app/page.jsx
  - data/e-codes.json
  - src/app/error.tsx
  - lib/rules/explain.js
  - src/lib/rate-limit.ts
  - src/types/ingredients.ts
  - src/lib/ocr.ts
  - data/blacklists.json
  - src/lib/crop-image.ts
  - public/vercel.svg
  - README.md
  - app/scan/components/ResultCard.jsx
  - app/scan/components/EmptyState.jsx
  - src/lib/ingredient-matcher.ts
  - src/app/favicon.ico
  - lib/ocr/cloudVision.js
  - src/components/OcrReview.tsx
  - src/lib/classifier.ts
  - public/next.svg
  - app/api/classify/route.js
  - src/data/ingredients.json
  - data/ingredients.base.json
  - app/layout.jsx
  - CLAUDE.md
  - src/app/api/analyze/route.ts
  - src/components/ResultDisplay.tsx
  - playwright.config.js
  - src/components/TextInput.tsx
  - lib/text/normalize.js
  - app/scan/components/ErrorState.jsx
  - src/app/globals.css
  - app/globals.css
  - lib/storage/history.js
  - app/api/filter-ingredients/route.js
  - postcss.config.js
  - src/components/ImageCropper.tsx
  - src/components/IngredientGroup.tsx
  - postcss.config.mjs
  - src/components/VerdictBanner.tsx
  - public/window.svg
  - app/scan/components/UploadArea.jsx
  - eslint.config.mjs
  - package.json
  - .env.example
  - tsconfig.json
  - lib/storage/aiJudgeCache.js
  - app/api/health/route.js
  - vitest.config.ts
  - data/stopwords.packaging.json
  - next.config.ts
  - app/history/page.jsx
  - src/lib/parser.ts
  - src/components/VegetarianTypeSwitcher.tsx
  - tests/text/manual-test.js
tests:
  - tests/e2e/happy-path.spec.js
  - src/lib/rate-limit.test.ts
  - tests/e2e/ai-filter.spec.js
  - tests/text/tokenize.test.js
  - src/lib/crop-image.test.ts
  - tests/text/tokenize-separator.test.js
  - tests/rules/explain.test.js
  - tests/text/normalize.test.js
  - tests/rules/classify.test.js
  - tests/rules/five-pungent.test.js
  - src/lib/ingredient-matcher.test.ts
  - tests/utils/filterNonIngredients.test.js
  - tests/ocr/tesseract.test.js
  - src/lib/verdict.test.ts
-->

---
### Requirement: Input mode switching
The system SHALL allow users to switch between image upload and text input modes. Only one input mode is active at a time.

#### Scenario: Switch from image to text mode
- **WHEN** user switches to text input mode while an image is loaded
- **THEN** the image is cleared and the textarea becomes active

#### Scenario: Switch from text to image mode
- **WHEN** user switches to image upload mode while text is entered
- **THEN** the text is cleared and the image upload control becomes active

<!-- @trace
source: veggiescan-mvp
updated: 2026-04-30
code:
  - app/scan/page.jsx
  - vitest.config.js
  - public/file.svg
  - src/lib/gemini.ts
  - server/controllers/filterIngredientsController.js
  - lib/ocr/index.js
  - lib/text/tokenize.js
  - src/lib/verdict.ts
  - app/scan/components/LoadingState.jsx
  - lib/rules/classify.js
  - lib/utils/filterNonIngredients.js
  - lib/ocr/tesseract.js
  - lib/ai/geminiJudge.js
  - src/app/page.tsx
  - data/whitelists.json
  - Dockerfile
  - src/app/api/ocr/route.ts
  - src/components/ImageUploader.tsx
  - src/app/api/parse/route.ts
  - app/api/ocr/route.js
  - lib/ai/geminiFilter.js
  - tailwind.config.js
  - .spectra.yaml
  - src/app/layout.tsx
  - public/globe.svg
  - app/page.jsx
  - data/e-codes.json
  - src/app/error.tsx
  - lib/rules/explain.js
  - src/lib/rate-limit.ts
  - src/types/ingredients.ts
  - src/lib/ocr.ts
  - data/blacklists.json
  - src/lib/crop-image.ts
  - public/vercel.svg
  - README.md
  - app/scan/components/ResultCard.jsx
  - app/scan/components/EmptyState.jsx
  - src/lib/ingredient-matcher.ts
  - src/app/favicon.ico
  - lib/ocr/cloudVision.js
  - src/components/OcrReview.tsx
  - src/lib/classifier.ts
  - public/next.svg
  - app/api/classify/route.js
  - src/data/ingredients.json
  - data/ingredients.base.json
  - app/layout.jsx
  - CLAUDE.md
  - src/app/api/analyze/route.ts
  - src/components/ResultDisplay.tsx
  - playwright.config.js
  - src/components/TextInput.tsx
  - lib/text/normalize.js
  - app/scan/components/ErrorState.jsx
  - src/app/globals.css
  - app/globals.css
  - lib/storage/history.js
  - app/api/filter-ingredients/route.js
  - postcss.config.js
  - src/components/ImageCropper.tsx
  - src/components/IngredientGroup.tsx
  - postcss.config.mjs
  - src/components/VerdictBanner.tsx
  - public/window.svg
  - app/scan/components/UploadArea.jsx
  - eslint.config.mjs
  - package.json
  - .env.example
  - tsconfig.json
  - lib/storage/aiJudgeCache.js
  - app/api/health/route.js
  - vitest.config.ts
  - data/stopwords.packaging.json
  - next.config.ts
  - app/history/page.jsx
  - src/lib/parser.ts
  - src/components/VegetarianTypeSwitcher.tsx
  - tests/text/manual-test.js
tests:
  - tests/e2e/happy-path.spec.js
  - src/lib/rate-limit.test.ts
  - tests/e2e/ai-filter.spec.js
  - tests/text/tokenize.test.js
  - src/lib/crop-image.test.ts
  - tests/text/tokenize-separator.test.js
  - tests/rules/explain.test.js
  - tests/text/normalize.test.js
  - tests/rules/classify.test.js
  - tests/rules/five-pungent.test.js
  - src/lib/ingredient-matcher.test.ts
  - tests/utils/filterNonIngredients.test.js
  - tests/ocr/tesseract.test.js
  - src/lib/verdict.test.ts
-->
# ingredient-parsing Specification

## Purpose

TBD - created by archiving change 'veggiescan-mvp'. Update Purpose after archive.

## Requirements

### Requirement: Filter non-ingredient information

The system SHALL use Gemini AI to separate the input text into two distinct outputs in a single call: an `ingredients` array containing only ingredient-related items (not nutritional information, manufacturing details, or marketing text), and a `notices` array capturing structured notices defined by the package-notices capability. Marketing text, nutritional facts, manufacturing details, and barcode numbers SHALL be discarded entirely. Allergen statements, storage instructions, expiration dates, and other consumer-facing warnings SHALL be retained in the `notices` array rather than discarded.

#### Scenario: Input contains mixed content

- **WHEN** text includes both ingredients and nutritional facts (e.g., "原料：砂糖、小麥粉、奶油 / 營養標示：熱量 200大卡")
- **THEN** the system extracts only the ingredient portion: 砂糖、小麥粉、奶油
- **AND** the nutritional facts SHALL be discarded (not retained in `notices`)

#### Scenario: Input contains ingredients and consumer notices

- **WHEN** text includes `原料：砂糖、麵粉` followed by `過敏原：本產品含有牛奶` and `賞味期限：2026.12.31`
- **THEN** the `ingredients` array SHALL contain `砂糖`, `麵粉`
- **AND** the `notices` array SHALL contain entries for the allergen statement and the expiration date

#### Scenario: Marketing text is still discarded

- **WHEN** text includes `原料：砂糖` followed by `★ 限量發售！買就送精美贈品 ★`
- **THEN** the marketing line SHALL NOT appear in either `ingredients` or `notices`


<!-- @trace
source: add-package-notices
updated: 2026-05-01
code:
  - src/lib/parser.ts
  - tsconfig.json
  - src/app/api/analyze/route.ts
  - src/types/ingredients.ts
  - src/app/page.tsx
  - src/components/ResultDisplay.tsx
  - src/components/NoticeBanner.tsx
tests:
  - src/lib/parser.test.ts
-->

---
### Requirement: Split compound ingredients
The system SHALL decompose compound ingredients enclosed in parentheses or brackets into individual sub-ingredients. Each sub-ingredient SHALL be listed separately for classification.

#### Scenario: Parenthesized compound ingredient
- **WHEN** input contains "調味料（蔗糖、鹽、味精）"
- **THEN** the system produces individual items: 蔗糖, 鹽, 味精

#### Scenario: Nested compound ingredients
- **WHEN** input contains "巧克力（可可粉、糖、乳化劑（大豆卵磷脂））"
- **THEN** the system produces: 可可粉, 糖, 大豆卵磷脂


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
### Requirement: Normalize ingredient text
The system SHALL merge line breaks and excess whitespace within ingredient names, and normalize punctuation (full-width/half-width commas, semicolons) to produce clean, individual ingredient entries.

#### Scenario: Multi-line ingredient text
- **WHEN** OCR output contains "砂糖、小麥\n粉、奶油"
- **THEN** the system merges "小麥粉" and outputs: 砂糖, 小麥粉, 奶油


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
### Requirement: Translate Japanese ingredient names
The system SHALL map Japanese ingredient names to their Chinese or English equivalents to enable database matching. The original Japanese name SHALL be preserved for display.

#### Scenario: Japanese ingredient with Chinese equivalent
- **WHEN** input contains "ゼラチン" (gelatin in Japanese)
- **THEN** the system maps it to "明膠" for database matching while keeping "ゼラチン" as the display name


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
### Requirement: Structured output format
The system SHALL return parsed ingredients as a structured list, where each item contains the original text as displayed on the packaging and a normalized name for database matching.

#### Scenario: Successful parsing
- **WHEN** ingredient text is parsed successfully
- **THEN** the system returns an array of objects, each with `originalText` (as shown on packaging) and `normalizedName` (for matching)

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
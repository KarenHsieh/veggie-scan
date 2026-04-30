# result-display Specification

## Purpose

TBD - created by archiving change 'veggiescan-mvp'. Update Purpose after archive.

## Requirements

### Requirement: Summary verdict banner
The system SHALL display a prominent summary banner at the top of the result area showing the overall product verdict. The banner SHALL use visual indicators: green with checkmark for safe, red with cross for non-vegetarian, yellow with warning for contains ambiguous ingredients.

#### Scenario: Product is safe for selected vegetarian type
- **WHEN** all ingredients are safe for the user's selected vegetarian type
- **THEN** the banner displays a green indicator with the message (e.g., "✅ 蛋奶素可食用") and a brief explanation

#### Scenario: Product contains non-vegetarian ingredients
- **WHEN** any ingredient is non-vegetarian
- **THEN** the banner displays a red indicator naming the problematic ingredient(s) (e.g., "❌ 含有動物性成分：明膠")

#### Scenario: Product contains ambiguous ingredients
- **WHEN** no non-vegetarian ingredients but ambiguous ingredients exist
- **THEN** the banner displays a yellow warning listing the ambiguous ingredients that need verification


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
### Requirement: Categorized ingredient detail list
The system SHALL display all ingredients grouped by severity, ordered from most concerning to least: non-vegetarian → five-pungent → egg/dairy → ambiguous → vegetarian. Each ingredient SHALL show its name, category, and a description explaining the classification reason.

#### Scenario: Display non-vegetarian ingredients
- **WHEN** results contain non-vegetarian ingredients
- **THEN** they appear in the topmost group labeled "🚫 不可食用（動物性成分）" with name and reason

#### Scenario: Display five-pungent ingredients
- **WHEN** results contain five-pungent ingredients
- **THEN** they appear in the "⚠️ 注意（五辛）" group with a note that they are safe for 五辛素

#### Scenario: Display ambiguous ingredients
- **WHEN** results contain ambiguous ingredients
- **THEN** they appear in the "❓ 無法確定" group with an explanation of why the label is ambiguous

#### Scenario: Display vegetarian-safe ingredients
- **WHEN** results contain vegetarian-safe ingredients
- **THEN** they appear in the "✅ 全素可食用" group, which is collapsible and collapsed by default


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
### Requirement: Vegetarian type switcher
The system SHALL display a selector with five vegetarian types (全素, 蛋素, 奶素, 蛋奶素, 五辛素). Switching the type SHALL immediately update the summary verdict and ingredient grouping without making additional API calls.

#### Scenario: User switches vegetarian type
- **WHEN** user changes the selector from 全素 to 蛋奶素
- **THEN** the summary verdict and ingredient grouping update instantly based on the new type, with dairy and egg ingredients moving from a warning group to the safe group

#### Scenario: Default vegetarian type
- **WHEN** the result page loads for the first time
- **THEN** the default vegetarian type is 全素 (most restrictive)


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
### Requirement: AI-classified ingredient indicator
Ingredients classified by AI (not from the static database) SHALL be visually marked to indicate the classification source.

#### Scenario: AI-classified ingredient display
- **WHEN** an ingredient was classified by Gemini AI
- **THEN** the ingredient entry shows an "AI 判定" badge alongside its classification


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
### Requirement: Clear and rescan
The system SHALL provide a clear button that resets all results and input, returning to the initial input state.

#### Scenario: User clears results
- **WHEN** user clicks the clear button
- **THEN** all results, cached data, and input fields are cleared, and the UI returns to the initial input state

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
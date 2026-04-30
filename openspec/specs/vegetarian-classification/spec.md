# vegetarian-classification Specification

## Purpose

TBD - created by archiving change 'veggiescan-mvp'. Update Purpose after archive.

## Requirements

### Requirement: Taiwan five-category vegetarian classification
The system SHALL support five vegetarian types as defined by Taiwan's regulations:
- **Vegan (全素/純素)**: plant-based ingredients only, no animal products, no five pungent vegetables
- **Egg vegetarian (蛋素)**: vegan + egg-derived ingredients
- **Lacto vegetarian (奶素)**: vegan + dairy-derived ingredients
- **Lacto-ovo vegetarian (蛋奶素/奶蛋素)**: vegan + egg + dairy
- **Five-pungent vegetarian (五辛素/植物五辛素)**: lacto-ovo + five pungent vegetables (onion, garlic, chives, rakkyo/shallot, asafoetida)

#### Scenario: Ingredient classification hierarchy
- **WHEN** an ingredient is classified as `vegetarian`
- **THEN** it is safe for all five vegetarian types

#### Scenario: Dairy ingredient classification
- **WHEN** an ingredient is classified as `dairy`
- **THEN** it is safe for 奶素, 蛋奶素, and 五辛素, but not for 全素 or 蛋素

#### Scenario: Egg ingredient classification
- **WHEN** an ingredient is classified as `egg`
- **THEN** it is safe for 蛋素, 蛋奶素, and 五辛素, but not for 全素 or 奶素

#### Scenario: Five-pungent ingredient classification
- **WHEN** an ingredient is classified as `five-pungent`
- **THEN** it is safe only for 五辛素

#### Scenario: Non-vegetarian ingredient classification
- **WHEN** an ingredient is classified as `non-vegetarian`
- **THEN** it is not safe for any vegetarian type


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
### Requirement: Product-level verdict
The system SHALL compute an overall verdict for the product based on all its ingredients. The verdict SHALL be the most restrictive category found among all ingredients. If any ingredient is `non-vegetarian`, the product verdict is `non-vegetarian`. If any ingredient is `ambiguous`, the verdict SHALL include a warning.

#### Scenario: All ingredients are vegan
- **WHEN** all ingredients are classified as `vegetarian`
- **THEN** the product verdict is "全素可食用"

#### Scenario: Contains dairy but nothing worse
- **WHEN** ingredients include dairy items but no egg, five-pungent, non-vegetarian, or ambiguous items
- **THEN** the product verdict is "奶素可食用"

#### Scenario: Contains non-vegetarian ingredient
- **WHEN** any ingredient is classified as `non-vegetarian`
- **THEN** the product verdict is "含有動物性成分，不適合素食者食用"

#### Scenario: Contains ambiguous ingredient
- **WHEN** ingredients include ambiguous items but no non-vegetarian items
- **THEN** the product verdict includes a warning listing the ambiguous ingredients that need manual verification


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
### Requirement: Verdict adapts to selected vegetarian type
The system SHALL re-evaluate the display verdict when the user switches their vegetarian type. The underlying ingredient classifications do not change — only the presentation of whether each ingredient is safe for the selected type.

#### Scenario: Switch from vegan to five-pungent view
- **WHEN** a product contains garlic (five-pungent) and the user switches from 全素 to 五辛素
- **THEN** garlic changes from "not safe" to "safe" in the display, and the overall verdict updates accordingly


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
### Requirement: AI classification for unknown ingredients
The system SHALL send unmatched ingredients to Gemini AI for classification. The AI response SHALL include the assigned category and a reason. AI-classified ingredients SHALL be visually distinguished from database-matched ingredients in the result display.

#### Scenario: AI classifies an unknown ingredient
- **WHEN** "紅花籽油" is not in the database and is sent to Gemini
- **THEN** Gemini returns a classification (e.g., `vegetarian`, reason: "植物性油脂，由紅花籽榨取") and the result is marked as "AI 判定"

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
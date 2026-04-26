## 1. Project Setup

- [x] 1.1 Initialize Next.js project with App Router and TypeScript (`npx create-next-app@latest` with TypeScript, ESLint, Tailwind CSS, App Router)
- [x] 1.2 Install `@google/generative-ai` package
- [x] 1.3 Create `.env.local` with `GEMINI_API_KEY` placeholder and add `.env.local` to `.gitignore`
- [x] 1.4 Set up project directory structure: `src/app/`, `src/components/`, `src/lib/`, `src/data/`, `src/types/`

## 2. Ingredient Database (Static JSON)

- [x] 2.1 Define TypeScript types for ingredient entries: `Ingredient` with `id`, `canonicalName`, `category`, `description`, `aliases` fields; `IngredientCategory` union type (`non-vegetarian` | `five-pungent` | `egg` | `dairy` | `ambiguous` | `vegetarian`)
- [x] 2.2 Create `src/data/ingredients.json` with initial dataset: common non-vegetarian ingredients (明膠/gelatin, 豬油/lard, 牛油/beef tallow, 魚露, 柴魚粉, 蜂蠟, 動物性鮮奶油, 蠔油, etc.), five-pungent ingredients (蔥, 蒜, 韭, 蕗蕎/薤, 興渠/阿魏 with all aliases), egg ingredients (蛋, 蛋黃, 蛋白, 卵, egg), dairy ingredients (牛奶, 奶粉, 乳糖, 乳清, cheese, butter), ambiguous ingredients (香料, 乳化劑, 天然色素, 調味料)
- [x] 2.3 Create `src/lib/ingredient-matcher.ts`: load JSON database, implement case-insensitive exact matching against canonical names and aliases, implement partial/substring matching for compound names (e.g., "大蒜粉" matches "大蒜"), return matched ingredient with match type (exact/partial) or null for unmatched

## 3. OCR Extraction (Phase 1 — Gemini)

- [x] 3.1 Create `src/lib/gemini.ts`: initialize Gemini client with API key from environment variable, export a configured `GenerativeModel` instance using `gemini-2.5-flash`
- [x] 3.2 Create `src/lib/ocr.ts`: implement `extractTextFromImage(imageBase64: string): Promise<string>` that sends the image to Gemini with a prompt instructing it to extract only the raw text from a food packaging ingredient label, preserving original language characters (Chinese, English, Japanese)
- [x] 3.3 Create API route `src/app/api/ocr/route.ts`: accept POST with image data (base64), call `extractTextFromImage`, return JSON with `{ text: string }`; include error handling for Gemini API failures returning appropriate HTTP status codes

## 4. Ingredient Parsing (Gemini)

- [x] 4.1 Create `src/lib/parser.ts`: implement `parseIngredients(rawText: string): Promise<ParsedIngredient[]>` that sends text to Gemini with a prompt to: filter non-ingredient content, split compound ingredients (including nested parentheses), merge broken lines, normalize whitespace, translate Japanese names to Chinese/English equivalents. Return array of `{ originalText, normalizedName }` objects
- [x] 4.2 Create API route `src/app/api/parse/route.ts`: accept POST with `{ text: string }`, call `parseIngredients`, return structured ingredient list

## 5. Vegetarian Classification

- [x] 5.1 Create `src/lib/classifier.ts`: implement `classifyIngredients(ingredients: ParsedIngredient[]): ClassifiedIngredient[]` that runs each ingredient through the JSON database matcher first; collect unmatched ingredients into a batch
- [x] 5.2 Implement `classifyWithAI(ingredients: string[]): Promise<AIClassification[]>` in `src/lib/classifier.ts`: send all unmatched ingredients to Gemini in a single call, prompt it to classify each as one of the six categories with a reason, parse the structured response
- [x] 5.3 Create `src/lib/verdict.ts`: implement `computeVerdict(classified: ClassifiedIngredient[], dietType: VegetarianType): Verdict` that computes the most restrictive category across all ingredients and returns the overall product verdict adapted to the selected vegetarian type
- [x] 5.4 Create API route `src/app/api/analyze/route.ts`: accept POST with `{ text: string }`, orchestrate the full pipeline (parse → match → AI classify unknowns → compute verdict), return complete analysis result

## 6. Rate Limiting

- [x] 6.1 Create `src/lib/rate-limiter.ts`: implement in-memory rate limiter with two counters — per-IP Map (default 20/day) and global counter (default 500/day). Include daily reset logic (midnight UTC). Export middleware function that checks both limits and returns remaining quota
- [x] 6.2 Apply rate limiting middleware to all API routes under `src/app/api/` that call Gemini (`/api/ocr`, `/api/parse`, `/api/analyze`). Return HTTP 429 with reset time when limit exceeded. Include `X-RateLimit-Remaining` header in successful responses

## 7. Frontend — Input Page

- [x] 7.1 Create main page `src/app/page.tsx` with two input modes: image upload (camera/file picker accepting JPEG/PNG/WebP, max 10MB) and textarea for manual text input. Include mode switching that clears the other input. Add submit button
- [x] 7.2 Create `src/components/ImageUploader.tsx`: drag-and-drop or click-to-upload component with file type/size validation, image preview, and error messages for invalid files
- [x] 7.3 Create `src/components/TextInput.tsx`: textarea component with placeholder text explaining expected input format

## 8. Frontend — OCR Review

- [x] 8.1 Create `src/components/OcrReview.tsx`: display extracted OCR text in an editable textarea, allow user to correct errors before proceeding. Include "使用此文字" (use this text) and "重新掃描" (rescan) buttons
- [x] 8.2 Wire OCR flow: image upload → call `/api/ocr` → show loading state → display OcrReview → on confirm, proceed to analysis

## 9. Frontend — Result Display

- [x] 9.1 Create `src/components/VegetarianTypeSwitcher.tsx`: horizontal selector for five vegetarian types (全素, 蛋素, 奶素, 蛋奶素, 五辛素), default to 全素
- [x] 9.2 Create `src/components/VerdictBanner.tsx`: large banner showing overall verdict with color coding (green/red/yellow) and icon, adapts to selected vegetarian type
- [x] 9.3 Create `src/components/IngredientGroup.tsx`: grouped ingredient list component that displays ingredients by severity category (🚫 不可食用, ⚠️ 五辛, 🥛 蛋奶, ❓ 無法確定, ✅ 全素可食). Each ingredient shows name, reason, and "AI 判定" badge if AI-classified. The 全素可食 group is collapsible and collapsed by default
- [x] 9.4 Create `src/components/ResultDisplay.tsx`: compose VegetarianTypeSwitcher + VerdictBanner + IngredientGroup. Implement client-side re-evaluation when vegetarian type changes (no API call). Include clear button that resets all state

## 10. Integration and Polish

- [x] 10.1 Wire full end-to-end flow: input → (OCR if image) → review → analyze → display results. Handle loading states and error states at each step
- [x] 10.2 Add responsive CSS: ensure the app works well on mobile (primary use case is photographing products in a store)
- [x] 10.3 Add error boundary and user-friendly error messages for Gemini API failures, rate limit exceeded, and network errors

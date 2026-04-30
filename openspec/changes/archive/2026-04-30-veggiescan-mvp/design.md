## Context

VeggieScan is a greenfield web application. There is no existing codebase — all components are new. The primary use case is a traveler in Japan photographing food packaging to check if ingredients are vegetarian-safe for friends back in Taiwan.

Key constraints from discussion:
- Minimize API calls (cost concern)
- Gemini 2.5 Flash handles both OCR and AI tasks (single service dependency)
- Static JSON ingredient database for known ingredients, AI only for unknowns
- No user accounts — rate limiting protects API costs instead
- Memory cache for debug convenience during development

## Goals / Non-Goals

**Goals:**
- Deliver a working web app that accepts food ingredient images or text and returns vegetarian classification results
- Support Taiwan's five vegetarian categories (全素、蛋素、奶素、蛋奶素、五辛素)
- Keep architecture simple: one backend, one frontend, one external API
- Phased development: validate OCR quality before building full pipeline

**Non-Goals:**
- User authentication or persistent storage
- Multi-language ingredient analysis (OCR reads Japanese, but classification is Chinese/English only)
- Mobile native app
- Real-time collaboration or multi-user features

## Decisions

### 1. Tech Stack: Next.js (Full-Stack)

Use Next.js with App Router for both frontend and API routes.

**Why over separate frontend + backend:**
- Single deployment unit, simpler infrastructure
- API routes handle Gemini calls server-side (API key stays on server)
- Built-in image optimization for uploaded photos
- React frontend with server components for fast initial load

**Alternatives considered:**
- Express + vanilla React: more setup, no clear benefit for this scale
- Vite + Express: same issue, and loses SSR benefits

### 2. OCR + Ingredient Parsing: Two-Phase Gemini Calls

Phase 1 (OCR only): Send image to Gemini with a prompt that extracts raw text only. Display extracted text to user for verification.

Phase 2 (Parse + Classify): Send extracted text (or manual input) to Gemini to clean, parse, and structure ingredients. Then run local JSON database matching. Only send unmatched ingredients back to Gemini for classification.

**Why two phases instead of one:**
- Debugging: can isolate OCR errors from classification errors
- User can correct OCR mistakes before classification
- Manual text input skips Phase 1 entirely
- Aligns with requirement to validate OCR quality first

**Why not three calls (OCR → parse → classify separately):**
- Parse + classify can share a single call since both operate on text
- Reduces API cost per scan

### 3. Ingredient Database: Static JSON with Alias Matching

Structure:
```json
{
  "ingredients": [
    {
      "id": "gelatin",
      "canonicalName": "明膠",
      "category": "non-vegetarian",
      "description": "動物骨骼/皮膚提煉的膠質",
      "aliases": ["gelatin", "ゼラチン", "E441", "動物膠", "吉利丁"]
    }
  ]
}
```

Categories: `non-vegetarian`, `five-pungent`, `egg`, `dairy`, `ambiguous`, `vegetarian`.

Matching strategy:
1. Normalize input (lowercase, trim whitespace, remove extra spaces)
2. Exact match against canonical name and all aliases
3. Partial/fuzzy match for compound names (e.g., "大蒜粉" contains "大蒜")
4. Unmatched ingredients go to Gemini for AI classification

**Why JSON over database:**
- No setup overhead, version-controlled with code
- Easy to review and contribute to
- Can migrate to DB later if needed

### 4. Rate Limiting: In-Memory with Two Tiers

- Per-IP limit: 20 requests/day (configurable)
- Global limit: 500 requests/day (configurable)
- Implementation: in-memory Map with daily reset
- Rate limit applies only to API routes that call Gemini

**Why in-memory over Redis/DB:**
- Single-server deployment, no need for distributed state
- Acceptable to reset on server restart (limits reset daily anyway)
- Simplest possible implementation

### 5. Frontend State: Memory Cache with Clear Button

- Store last scan result in React state (not persistent)
- Clear button resets state, allowing new scan
- No localStorage or sessionStorage — refreshing page clears everything
- This matches the debug-friendly requirement from 需求.md

### 6. Vegetarian Type System

Hierarchy (from most restrictive to least):
```
VEGAN (全素) ⊂ EGG (蛋素) ⊂ LACTO_OVO (蛋奶素) ⊂ FIVE_PUNGENT (五辛素)
VEGAN (全素) ⊂ LACTO (奶素) ⊂ LACTO_OVO (蛋奶素) ⊂ FIVE_PUNGENT (五辛素)
```

Each ingredient gets a `minLevel` — the minimum vegetarian type that can consume it:
- `non-vegetarian` → no vegetarian type can eat this
- `five-pungent` → only 五辛素 can eat this
- `egg` → 蛋素、蛋奶素、五辛素 can eat this
- `dairy` → 奶素、蛋奶素、五辛素 can eat this
- `vegetarian` → all types can eat this
- `ambiguous` → displayed separately as "unable to determine"

Result page re-evaluates display when user switches vegetarian type — no re-fetching needed, just client-side filtering.

## Risks / Trade-offs

**[Gemini OCR quality for small text]** → Validate in Phase 1 development. If quality is insufficient for specific packaging types, can add Google Cloud Vision as a fallback OCR (1,000 free/month). Decision deferred until testing.

**[JSON database coverage]** → Initial database will not cover all possible ingredients. Mitigation: AI handles unknowns. Over time, commonly queried unknown ingredients can be added to JSON.

**[Rate limit bypass via IP rotation]** → Accepted risk for MVP. Mitigation: global daily cap provides a hard ceiling regardless of IP. Can add Cloudflare Turnstile later if needed.

**[Gemini API cost spikes]** → Global daily limit caps worst-case cost. At 500 requests/day with ~2 calls each, worst case is ~1,000 Gemini calls/day ≈ $0.50/day with Flash pricing.

**[Japanese ingredient names not in database]** → OCR reads Japanese, but database entries are primarily Chinese/English. Mitigation: Gemini parsing step translates/maps Japanese ingredient names to Chinese equivalents before database matching.

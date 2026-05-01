# package-notices Specification

## Purpose

TBD - created by archiving change 'add-package-notices'. Update Purpose after archive.

## Requirements

### Requirement: Package notice extraction

The system SHALL extract structured notices from food packaging text alongside ingredients in a single Gemini API call. Each extracted notice SHALL be classified into one of four types: `allergen`, `storage`, `expiration`, or `other`. The original text on the packaging SHALL be preserved verbatim in the notice's `text` field — the system SHALL NOT translate, normalize, or paraphrase notice text.

#### Scenario: Allergen statement is extracted

- **WHEN** the input text contains `過敏原：本產品含有牛奶、雞蛋及其製品`
- **THEN** the analysis result SHALL include a notice with `type: "allergen"` and `text: "本產品含有牛奶、雞蛋及其製品"`

#### Scenario: Storage instruction is extracted

- **WHEN** the input text contains `保存方式：請冷藏保存於 7°C 以下`
- **THEN** the analysis result SHALL include a notice with `type: "storage"` and `text: "請冷藏保存於 7°C 以下"`

#### Scenario: Expiration date is extracted

- **WHEN** the input text contains `賞味期限：2026.12.31`
- **THEN** the analysis result SHALL include a notice with `type: "expiration"` and `text: "2026.12.31"`

#### Scenario: Unclassified warning falls into the other category

- **WHEN** the input text contains `開封後請盡早食用`
- **THEN** the analysis result SHALL include a notice with `type: "other"` and `text: "開封後請盡早食用"`

#### Scenario: Multilingual notice preserves original language

- **WHEN** the input text contains a Japanese expiration label `賞味期限：2026.12.31 まで`
- **THEN** the resulting notice's `text` SHALL be `2026.12.31 まで` (or the closest verbatim slice of the original) and SHALL NOT be translated to Chinese or English

##### Example: typical mixed-content label

- **GIVEN** the input text:
  ```
  原料：砂糖、麵粉、鮮奶、雞蛋、可可粉
  過敏原：本產品含有牛奶、雞蛋及其製品
  保存方式：請冷藏保存於 7°C 以下
  賞味期限：2026.12.31
  開封後請盡早食用
  ```
- **WHEN** the system processes the text
- **THEN** the resulting `notices` array SHALL contain exactly four entries with the following types and texts:

  | type | text |
  |------|------|
  | `allergen` | `本產品含有牛奶、雞蛋及其製品` |
  | `storage` | `請冷藏保存於 7°C 以下` |
  | `expiration` | `2026.12.31` |
  | `other` | `開封後請盡早食用` |


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
### Requirement: Schema-tolerant notice extraction

The system SHALL treat the `notices` field as optional in the Gemini response. When `notices` is missing, is not an array, or contains entries with invalid shape, the system SHALL substitute an empty array and SHALL log a warning via `console.warn`, but SHALL NOT raise an exception or fail the ingredient analysis pipeline.

#### Scenario: Missing notices field falls back to empty array

- **WHEN** Gemini returns `{ "ingredients": [...] }` without a `notices` key
- **THEN** the analysis result SHALL contain an empty `notices` array
- **AND** ingredient classification SHALL proceed normally

#### Scenario: Malformed notices entry is dropped

- **WHEN** Gemini returns `{ "ingredients": [...], "notices": [{ "text": "..." }] }` (missing `type` field on a notice entry)
- **THEN** the malformed entry SHALL be discarded
- **AND** the system SHALL log a warning identifying the malformed payload
- **AND** the remaining valid entries SHALL still be returned

#### Scenario: Unknown notice type is downgraded to other

- **WHEN** Gemini returns a notice entry with `type: "warning"` (not in the allowed enum)
- **THEN** that entry SHALL be retained with `type: "other"` and the original `text` preserved


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
### Requirement: Analyze API exposes notices field

The `POST /api/analyze` endpoint SHALL include a `notices` array in its 200 response body. The field SHALL always be present (empty array when no notices were extracted) so callers can rely on the schema. The change SHALL be additive — existing fields `ingredients` and `verdict` SHALL retain their current shape and semantics.

#### Scenario: Successful analysis returns notices alongside ingredients and verdict

- **WHEN** a valid analyze request is processed
- **THEN** the 200 response body SHALL be a JSON object with the keys `ingredients`, `verdict`, and `notices`
- **AND** `notices` SHALL be an array (possibly empty)

#### Scenario: Analysis with no extractable notices returns empty array

- **WHEN** the input text contains only ingredients and no notices
- **THEN** the response `notices` SHALL be `[]` (empty array, not `null` or missing)


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
### Requirement: Notice display banners

The result page SHALL display package notices in two distinct banners with different placement and prominence based on notice type. The allergen banner SHALL be placed visually above the verdict banner with prominent warning styling and the title "過敏原警示". The secondary banner — covering `storage`, `expiration`, and `other` types — SHALL be placed visually below the ingredient detail list with subtle (non-warning) styling and the title "其他包裝資訊". Each banner SHALL render only when at least one notice of its scoped types exists; the corresponding banner SHALL be hidden when its subset is empty. Banner contents SHALL NOT change when the user switches `dietType`. Within each banner, entries SHALL be grouped by `NoticeType` in the fixed order `allergen` → `storage` → `expiration` → `other`, with localized Traditional Chinese group labels (過敏原 / 保存方式 / 賞味期限 / 其他注意事項).

#### Scenario: Allergen banner renders above verdict when allergens exist

- **WHEN** the result page renders with at least one notice of type `allergen`
- **THEN** an allergen banner SHALL appear visually above the verdict banner with prominent warning styling
- **AND** the banner SHALL contain only the `allergen`-typed entries

#### Scenario: Secondary banner renders below ingredient list when non-allergen notices exist

- **WHEN** the result page renders with at least one notice of type `storage`, `expiration`, or `other`
- **THEN** a secondary banner SHALL appear visually below the ingredient detail list with subtle (non-warning) styling
- **AND** the banner SHALL contain only the `storage`, `expiration`, and `other` entries — `allergen` entries SHALL NOT appear in the secondary banner

#### Scenario: Both banners hidden when notices array is empty

- **WHEN** the result page renders with `notices.length === 0`
- **THEN** neither banner SHALL be present in the DOM

#### Scenario: Allergen-only notices hide the secondary banner

- **GIVEN** the response contains notices of type `allergen` only
- **WHEN** the result page renders
- **THEN** the allergen banner SHALL render above the verdict
- **AND** the secondary banner SHALL NOT be present in the DOM

#### Scenario: Non-allergen-only notices hide the allergen banner

- **GIVEN** the response contains notices of types `storage`, `expiration`, or `other` only (no `allergen`)
- **WHEN** the result page renders
- **THEN** the secondary banner SHALL render below the ingredient list
- **AND** the allergen banner SHALL NOT be present in the DOM

#### Scenario: Banners are independent of vegetarian type switch

- **GIVEN** the result page shows banners with notices of various types
- **WHEN** the user changes `dietType` from `vegan` to `lacto-ovo`
- **THEN** the contents of both banners SHALL remain unchanged

##### Example: group ordering within the secondary banner

- **GIVEN** notices with types in arrival order: `[other, storage, expiration, expiration, other]`
- **WHEN** the secondary banner renders
- **THEN** the rendered group order SHALL be: 保存方式 (1 entry) → 賞味期限 (2 entries) → 其他注意事項 (2 entries)


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
### Requirement: Per-group display cap

The notice banner SHALL display at most 5 entries per group. When a group contains more than 5 entries, the banner SHALL display the first 5 and SHALL append a localized "⋯ 還有 N 則" indicator showing the truncated count. The API response SHALL NOT be truncated — only the UI applies the cap.

#### Scenario: Group with 6 entries shows 5 plus truncation indicator

- **GIVEN** the `other` group contains 6 notice entries
- **WHEN** the banner renders that group
- **THEN** exactly 5 entries SHALL be visible
- **AND** an indicator with text containing `還有 1 則` SHALL appear below the visible entries

#### Scenario: API response remains uncapped

- **GIVEN** the `other` group contains 6 notice entries
- **WHEN** the `/api/analyze` response is inspected
- **THEN** the `notices` array SHALL contain all 6 entries

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
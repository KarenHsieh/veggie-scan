## MODIFIED Requirements

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

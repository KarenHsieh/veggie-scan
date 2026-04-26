## ADDED Requirements

### Requirement: Filter non-ingredient information
The system SHALL use Gemini AI to filter out non-ingredient content from the input text, including nutritional information, storage instructions, manufacturing details, and marketing text. Only ingredient-related data SHALL be retained.

#### Scenario: Input contains mixed content
- **WHEN** text includes both ingredients and nutritional facts (e.g., "原料：砂糖、小麥粉、奶油 / 營養標示：熱量 200大卡")
- **THEN** the system extracts only the ingredient portion: 砂糖、小麥粉、奶油

### Requirement: Split compound ingredients
The system SHALL decompose compound ingredients enclosed in parentheses or brackets into individual sub-ingredients. Each sub-ingredient SHALL be listed separately for classification.

#### Scenario: Parenthesized compound ingredient
- **WHEN** input contains "調味料（蔗糖、鹽、味精）"
- **THEN** the system produces individual items: 蔗糖, 鹽, 味精

#### Scenario: Nested compound ingredients
- **WHEN** input contains "巧克力（可可粉、糖、乳化劑（大豆卵磷脂））"
- **THEN** the system produces: 可可粉, 糖, 大豆卵磷脂

### Requirement: Normalize ingredient text
The system SHALL merge line breaks and excess whitespace within ingredient names, and normalize punctuation (full-width/half-width commas, semicolons) to produce clean, individual ingredient entries.

#### Scenario: Multi-line ingredient text
- **WHEN** OCR output contains "砂糖、小麥\n粉、奶油"
- **THEN** the system merges "小麥粉" and outputs: 砂糖, 小麥粉, 奶油

### Requirement: Translate Japanese ingredient names
The system SHALL map Japanese ingredient names to their Chinese or English equivalents to enable database matching. The original Japanese name SHALL be preserved for display.

#### Scenario: Japanese ingredient with Chinese equivalent
- **WHEN** input contains "ゼラチン" (gelatin in Japanese)
- **THEN** the system maps it to "明膠" for database matching while keeping "ゼラチン" as the display name

### Requirement: Structured output format
The system SHALL return parsed ingredients as a structured list, where each item contains the original text as displayed on the packaging and a normalized name for database matching.

#### Scenario: Successful parsing
- **WHEN** ingredient text is parsed successfully
- **THEN** the system returns an array of objects, each with `originalText` (as shown on packaging) and `normalizedName` (for matching)

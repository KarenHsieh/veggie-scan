## ADDED Requirements

### Requirement: Static JSON ingredient database
The system SHALL maintain a static JSON file containing known food ingredients with their vegetarian classification. Each ingredient entry SHALL include a canonical name, category, human-readable description, and a list of aliases (including alternate names, scientific names, abbreviations, and names in other languages).

#### Scenario: Database structure
- **WHEN** the ingredient database is loaded
- **THEN** each entry contains: `id` (string), `canonicalName` (string), `category` (one of: non-vegetarian, five-pungent, egg, dairy, ambiguous, vegetarian), `description` (string explaining why), and `aliases` (array of strings)

### Requirement: Ingredient categories
The system SHALL classify ingredients into exactly six categories:
- `non-vegetarian`: animal-derived ingredients (e.g., gelatin, lard, fish extract)
- `five-pungent`: five pungent vegetables — green onion, garlic, chives, shallot/rakkyo, asafoetida
- `egg`: egg and egg-derived ingredients
- `dairy`: milk and milk-derived ingredients
- `ambiguous`: vague labels that cannot be definitively classified (e.g., "香料", "乳化劑", "天然色素")
- `vegetarian`: plant-based ingredients safe for all vegetarian types

#### Scenario: Non-vegetarian ingredient lookup
- **WHEN** the system looks up "明膠"
- **THEN** it matches the entry with category `non-vegetarian` and description "動物骨骼/皮膚提煉的膠質"

#### Scenario: Five-pungent ingredient lookup
- **WHEN** the system looks up "大蒜" or "garlic" or "にんにく"
- **THEN** it matches the garlic entry with category `five-pungent` via alias matching

#### Scenario: Ambiguous ingredient lookup
- **WHEN** the system looks up "香料"
- **THEN** it matches with category `ambiguous` and description indicating the label is too vague to determine

### Requirement: Alias matching
The system SHALL match input ingredient names against both the canonical name and all aliases of each database entry. Matching SHALL be case-insensitive and whitespace-normalized.

#### Scenario: Match by English alias
- **WHEN** input contains "gelatin"
- **THEN** the system matches it to the "明膠" entry via alias

#### Scenario: Match by Japanese alias
- **WHEN** input contains "ゼラチン"
- **THEN** the system matches it to the "明膠" entry via alias

#### Scenario: Match by food additive code
- **WHEN** input contains "E441"
- **THEN** the system matches it to the "明膠" entry via alias

### Requirement: Partial match for compound names
The system SHALL support partial matching where a known ingredient name appears as a substring of the input (e.g., "大蒜粉" contains "大蒜"). Partial matches SHALL be flagged with lower confidence than exact matches.

#### Scenario: Compound name containing known ingredient
- **WHEN** input contains "大蒜粉" and database has "大蒜" as a five-pungent ingredient
- **THEN** the system matches "大蒜粉" to the "大蒜" entry via partial match

### Requirement: Unmatched ingredients fallback to AI
Ingredients that do not match any database entry (exact or partial) SHALL be sent to Gemini AI for classification.

#### Scenario: Unknown ingredient
- **WHEN** input contains "紅花籽油" and no database entry matches
- **THEN** the system sends "紅花籽油" to Gemini for AI-based classification

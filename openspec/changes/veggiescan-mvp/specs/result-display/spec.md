## ADDED Requirements

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

### Requirement: Vegetarian type switcher
The system SHALL display a selector with five vegetarian types (全素, 蛋素, 奶素, 蛋奶素, 五辛素). Switching the type SHALL immediately update the summary verdict and ingredient grouping without making additional API calls.

#### Scenario: User switches vegetarian type
- **WHEN** user changes the selector from 全素 to 蛋奶素
- **THEN** the summary verdict and ingredient grouping update instantly based on the new type, with dairy and egg ingredients moving from a warning group to the safe group

#### Scenario: Default vegetarian type
- **WHEN** the result page loads for the first time
- **THEN** the default vegetarian type is 全素 (most restrictive)

### Requirement: AI-classified ingredient indicator
Ingredients classified by AI (not from the static database) SHALL be visually marked to indicate the classification source.

#### Scenario: AI-classified ingredient display
- **WHEN** an ingredient was classified by Gemini AI
- **THEN** the ingredient entry shows an "AI 判定" badge alongside its classification

### Requirement: Clear and rescan
The system SHALL provide a clear button that resets all results and input, returning to the initial input state.

#### Scenario: User clears results
- **WHEN** user clicks the clear button
- **THEN** all results, cached data, and input fields are cleared, and the UI returns to the initial input state

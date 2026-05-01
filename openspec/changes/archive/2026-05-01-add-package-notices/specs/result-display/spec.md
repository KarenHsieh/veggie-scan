## ADDED Requirements

### Requirement: Package notice section above verdict

The result page SHALL render a "包裝注意事項" section above the existing verdict banner whenever the analysis result contains at least one notice. The section SHALL be visible regardless of which `dietType` the user has selected. When the result contains zero notices, the section SHALL NOT be rendered (no empty placeholder).

#### Scenario: Notices section appears above the verdict banner

- **WHEN** the result page renders with `notices.length > 0`
- **THEN** the notice section SHALL be positioned visually above the `<VerdictBanner>` element in the rendered DOM

#### Scenario: Notices section is omitted when empty

- **WHEN** the result page renders with `notices.length === 0`
- **THEN** no notice section SHALL be rendered in the DOM
- **AND** the layout SHALL match the previous behavior (no notice region at all)

#### Scenario: Switching vegetarian type does not affect notices

- **GIVEN** a result with at least one notice and the page currently showing `dietType: vegan`
- **WHEN** the user switches `dietType` to `lacto-ovo` via the type switcher
- **THEN** the notice section content SHALL remain unchanged
- **AND** only the verdict banner and ingredient grouping SHALL update to reflect the new diet type

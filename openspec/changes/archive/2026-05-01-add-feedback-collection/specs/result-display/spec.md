## ADDED Requirements

### Requirement: Per-ingredient feedback selection control

Each ingredient row in the categorized ingredient detail list SHALL include a checkbox control that lets the user mark that ingredient as a feedback candidate. The checkbox SHALL be available for ingredients from both `database` and `ai` sources. Toggling a checkbox SHALL only update the local selection state and SHALL NOT trigger any network request.

#### Scenario: Checkbox is rendered for every ingredient

- **WHEN** the result page renders the categorized ingredient detail list with N ingredients
- **THEN** exactly N checkbox controls SHALL be present, one aligned with each ingredient row
- **AND** the checkbox SHALL be rendered for both database-sourced and AI-sourced ingredients

#### Scenario: Toggling a checkbox does not call the network

- **WHEN** the user clicks a checkbox to toggle its state
- **THEN** the system SHALL update the in-memory selection set
- **AND** SHALL NOT issue any HTTP request

#### Scenario: Selection persists when expanding or collapsing groups

- **WHEN** the user checks an ingredient inside a group, then collapses and re-expands the same group
- **THEN** the previously checked checkbox SHALL still be checked

### Requirement: Feedback submission entry point

The result page SHALL provide a "回報有誤" button positioned below the categorized ingredient detail list. Clicking the button SHALL open a feedback modal that displays the currently selected ingredients and lets the user finalize and submit the report. The button SHALL always be enabled while the result page is shown, including when zero ingredients are checked.

#### Scenario: Button opens feedback modal

- **WHEN** the user clicks the "回報有誤" button
- **THEN** the system SHALL open the feedback modal
- **AND** the modal SHALL pre-populate its selection field with the ingredients currently checked on the result page

#### Scenario: Submitting from the modal sends the report

- **WHEN** the user submits the modal with at least one flagged ingredient or a non-empty user note
- **THEN** the system SHALL POST the feedback payload as defined by the feedback-collection capability
- **AND** display a success or failure status to the user based on the response

#### Scenario: Closing the modal preserves checkbox selections

- **WHEN** the user opens the modal and then closes it without submitting
- **THEN** the checkboxes on the result page SHALL retain the same checked state as before opening the modal

#### Scenario: Successful submission resets the selection

- **WHEN** the modal receives a 200 response from the feedback API
- **THEN** the system SHALL display a success message
- **AND** SHALL clear all checkbox selections on the result page after the modal is dismissed

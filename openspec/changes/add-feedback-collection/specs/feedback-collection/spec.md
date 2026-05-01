## ADDED Requirements

### Requirement: User feedback submission flow

The system SHALL provide a UI flow on the analysis result page that lets the user select one or more ingredient classifications they suspect are incorrect, optionally add a free-text comment and a suggested correct category, and submit the report in a single action. The flow SHALL begin with per-ingredient checkboxes, proceed through a confirmation modal, and end with an explicit success or failure status message.

#### Scenario: User flags a single ingredient via the modal

- **WHEN** the user checks the checkbox next to an AI-classified ingredient on the result page, clicks the "回報有誤" button, then submits the modal without entering a note or suggested category
- **THEN** the system SHALL POST a JSON payload to `/api/feedback` containing the flagged ingredient's `originalText`, `category`, `source`, the full classified ingredient list, the active `dietType`, and an empty `userNote`
- **AND** display a success message in the modal upon a 200 response

#### Scenario: User opens the modal without flagging any ingredient

- **WHEN** the user clicks the "回報有誤" button without checking any ingredient checkbox
- **THEN** the modal SHALL still open with an empty selection
- **AND** the submit button inside the modal SHALL be disabled until at least one ingredient is flagged or a non-empty `userNote` is entered

#### Scenario: User cancels the modal

- **WHEN** the user opens the modal, optionally edits its fields, then clicks the cancel control or closes the modal
- **THEN** the system SHALL NOT issue any network request
- **AND** SHALL preserve the original checkbox selections on the result page so the user can resume

### Requirement: Feedback API endpoint contract

The system SHALL expose `POST /api/feedback` that accepts a JSON request body and returns a JSON response. On success it SHALL return HTTP 200 with body `{ "ok": true }`. On client error it SHALL return HTTP 400 with body `{ "error": "<error_code>", "message": <human_readable_string> }`. On server error it SHALL return HTTP 500 with body `{ "error": "feedback_failed", "message": <human_readable_string> }`. On rate-limit rejection the response SHALL conform to the rate-limiting capability's 429 response format.

The request body SHALL contain the following fields:

- `ingredients`: array of objects, each with `originalText` (string), `category` (one of the six `IngredientCategory` values), `source` (`"database"` or `"ai"`), and `description` (string).
- `flaggedIndices`: array of non-negative integers identifying which entries in `ingredients` are being reported.
- `dietType`: one of the five `VegetarianType` values.
- `userNote` (optional): string up to 1000 characters.
- `suggestedCategory` (optional): one of the six `IngredientCategory` values.

#### Scenario: Successful submission

- **WHEN** a request arrives with a well-formed body containing at least one entry in `flaggedIndices` and the rate-limit check passes
- **THEN** the system SHALL respond with HTTP 200 and body `{ "ok": true }`
- **AND** SHALL trigger one outbound notification email before responding

#### Scenario: Missing required fields

- **WHEN** a request body lacks `ingredients`, `flaggedIndices`, or `dietType`, or any required field has the wrong type
- **THEN** the system SHALL respond with HTTP 400 and body `{ "error": "invalid_payload", "message": <string> }`
- **AND** SHALL NOT send any email

#### Scenario: Empty flagged selection without user note

- **WHEN** `flaggedIndices` is empty AND `userNote` is missing or empty
- **THEN** the system SHALL respond with HTTP 400 and body `{ "error": "empty_feedback", "message": <string> }`

#### Scenario: Out-of-range flagged index

- **WHEN** any value in `flaggedIndices` is negative or greater than or equal to `ingredients.length`
- **THEN** the system SHALL respond with HTTP 400 and body `{ "error": "invalid_payload", "message": <string> }`

#### Scenario: Oversized payload rejected

- **WHEN** the serialized request body exceeds 30 KB
- **THEN** the system SHALL respond with HTTP 400 and body `{ "error": "payload_too_large", "message": <string> }`

#### Scenario: User note exceeds length limit

- **WHEN** `userNote` is provided and its length exceeds 1000 characters
- **THEN** the system SHALL respond with HTTP 400 and body `{ "error": "invalid_payload", "message": <string> }`

#### Scenario: Invalid category enum

- **WHEN** any `ingredients[].category` or `suggestedCategory` value is not one of the six `IngredientCategory` values
- **THEN** the system SHALL respond with HTTP 400 and body `{ "error": "invalid_payload", "message": <string> }`

##### Example: error response shapes

| Condition | HTTP status | Response body |
|-----------|-------------|---------------|
| Valid submission | 200 | `{ "ok": true }` |
| Missing `ingredients` field | 400 | `{ "error": "invalid_payload", "message": "ingredients is required" }` |
| `flaggedIndices: []` and no `userNote` | 400 | `{ "error": "empty_feedback", "message": "請至少勾選一個成分或填寫補充說明" }` |
| Body 35 KB | 400 | `{ "error": "payload_too_large", "message": "回報內容過大" }` |
| Email send fails | 500 | `{ "error": "feedback_failed", "message": "回報寄送失敗，請稍後再試" }` |

### Requirement: Email notification delivery

When the API receives a valid feedback submission, the system SHALL send exactly one notification email via the Resend HTTP API before returning the success response. The email SHALL be sent from `onboarding@resend.dev` (or another sender configured by the deployer) to the address specified by the `FEEDBACK_RECIPIENT_EMAIL` environment variable, falling back to `mooshi21824@gmail.com` if that variable is not set.

The email body SHALL include:

- An ISO 8601 timestamp in `Asia/Taipei` timezone.
- The first 8 characters of the SHA-256 hash of the resolved client IP, prefixed with `IP#`, used as a non-reversible identifier for correlating multiple reports from the same source.
- The `dietType` selected by the user.
- The full `ingredients` array, with the flagged entries highlighted (e.g., prefixed with `[FLAGGED]`).
- The `userNote` text if provided.
- The `suggestedCategory` value if provided.

#### Scenario: Email is sent on successful submission

- **WHEN** a valid feedback submission is received and the rate-limit check passes
- **THEN** the system SHALL invoke the Resend send-email API exactly once
- **AND** SHALL await the result before responding to the client

#### Scenario: Email send failure surfaces as 500

- **WHEN** the Resend API returns an error or the request times out
- **THEN** the system SHALL respond to the client with HTTP 500 and body `{ "error": "feedback_failed", "message": <string> }`
- **AND** SHALL log the underlying error message via `console.error` without including the API key

#### Scenario: Missing API key configuration

- **WHEN** the `RESEND_API_KEY` environment variable is not set at request time
- **THEN** the system SHALL respond with HTTP 500 and body `{ "error": "feedback_failed", "message": <string> }`
- **AND** SHALL log a configuration error via `console.error`
- **AND** SHALL NOT attempt to send via any alternative transport

#### Scenario: Recipient email falls back when env var missing

- **WHEN** the `FEEDBACK_RECIPIENT_EMAIL` environment variable is not set but `RESEND_API_KEY` is set
- **THEN** the system SHALL send the email to `mooshi21824@gmail.com`
- **AND** SHALL log a warning via `console.warn`

### Requirement: Email content includes flagged-vs-context distinction

The email SHALL clearly distinguish ingredients explicitly flagged by the user from the surrounding ingredients included as context. The flagged entries SHALL appear in a dedicated section whose heading is the Traditional Chinese label `已勾選成分：` with each entry showing its original text, current category, classification source, and (if provided) the user's suggested category. The full unfiltered ingredient list SHALL appear in a separate section whose heading is the Traditional Chinese label `完整成分清單：`. All section headings, field labels, and source/category indicators in the email body SHALL be rendered in Traditional Chinese (繁體中文); only enum values, timestamps, and identifiers MAY remain in their original ASCII form.

#### Scenario: Flagged ingredients are highlighted distinctly from context

- **GIVEN** a submission with `ingredients` of length 5 and `flaggedIndices` of `[1, 3]`
- **WHEN** the email is generated
- **THEN** the email body SHALL contain a `已勾選成分：` section listing exactly 2 entries (indices 1 and 3)
- **AND** the email body SHALL contain a `完整成分清單：` section listing all 5 entries

#### Scenario: Email body uses Traditional Chinese labels

- **WHEN** the email is generated for any valid submission
- **THEN** the body SHALL use the Traditional Chinese labels `送出時間：`, `來源識別：`, `素食類型：`, `已勾選成分：`, `完整成分清單：`, and (when applicable) `建議分類：` and `補充說明：`
- **AND** the body SHALL NOT contain the equivalent English labels (`Submitted at:`, `Client:`, `Diet type:`, `Flagged ingredients:`, `Full ingredient list:`, `User suggested category:`, `User note:`)

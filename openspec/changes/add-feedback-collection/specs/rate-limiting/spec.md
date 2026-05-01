## ADDED Requirements

### Requirement: Independent quota bucket for the feedback endpoint

The system SHALL enforce a per-IP request quota on `POST /api/feedback` using a quota bucket that is separate from the bucket shared by `/api/ocr`, `/api/parse`, and `/api/analyze`. The feedback bucket SHALL allow 10 requests per rolling fixed 1-hour window per IP. Requests exceeding this quota SHALL be rejected with HTTP 429 and SHALL conform to the existing 429 response format requirement.

#### Scenario: Feedback request within feedback quota succeeds

- **WHEN** an IP has made fewer than 10 requests to `/api/feedback` within the current 1-hour window
- **THEN** the system SHALL process the request normally and increment the IP's feedback bucket counter by 1

#### Scenario: Feedback quota does not consume the analyze bucket

- **GIVEN** an IP has already made 30 requests to `/api/analyze` and is therefore at the analyze bucket limit
- **WHEN** the same IP sends a request to `/api/feedback`
- **THEN** the system SHALL evaluate the request against the feedback bucket only
- **AND** SHALL NOT reject the request based on the analyze bucket counter

#### Scenario: Analyze quota does not consume the feedback bucket

- **GIVEN** an IP has already made 10 requests to `/api/feedback` and is therefore at the feedback bucket limit
- **WHEN** the same IP sends a request to `/api/analyze`
- **THEN** the system SHALL evaluate the request against the analyze bucket only
- **AND** SHALL NOT reject the request based on the feedback bucket counter

#### Scenario: Feedback request exceeding feedback quota is rejected

- **WHEN** an IP has already made 10 requests to `/api/feedback` within the current 1-hour window and sends another request to `/api/feedback`
- **THEN** the system SHALL respond with HTTP 429 and SHALL NOT invoke the underlying handler
- **AND** the response body and headers SHALL conform to the 429 response format requirement

#### Scenario: Feedback bucket resets after window expires

- **WHEN** the 1-hour window for an IP's feedback bucket has elapsed since its first counted feedback request
- **THEN** the system SHALL reset that IP's feedback counter to zero and the next feedback request SHALL be counted as the first request of a new window

#### Scenario: Feedback rate limit follows development bypass

- **WHEN** the server is running with `NODE_ENV` set to any value other than `"production"`
- **THEN** the system SHALL process every `/api/feedback` request without consulting or updating the feedback bucket state

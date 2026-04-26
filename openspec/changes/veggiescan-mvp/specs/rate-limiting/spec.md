## ADDED Requirements

### Requirement: Per-IP rate limiting
The system SHALL limit the number of API requests (OCR and AI classification) per IP address to a configurable daily maximum (default: 20 requests/day). The counter resets at midnight UTC.

#### Scenario: User within limit
- **WHEN** a user has made fewer than 20 requests today
- **THEN** the request proceeds normally

#### Scenario: User exceeds limit
- **WHEN** a user's IP has reached the daily maximum
- **THEN** the system returns an HTTP 429 response with a message indicating the daily limit has been reached and when it resets

### Requirement: Global daily request cap
The system SHALL enforce a global daily maximum across all users (default: 500 requests/day). This cap prevents total API cost from exceeding a predictable budget regardless of the number of users.

#### Scenario: Global limit not reached
- **WHEN** total daily requests across all users are below 500
- **THEN** requests proceed normally (subject to per-IP limits)

#### Scenario: Global limit reached
- **WHEN** total daily requests reach 500
- **THEN** all subsequent requests receive an HTTP 429 response with a message indicating the service has reached its daily capacity

### Requirement: Rate limit applies only to Gemini API calls
The system SHALL only count requests that trigger Gemini API calls toward rate limits. Static page loads, client-side interactions, and requests served from cache SHALL NOT count.

#### Scenario: Static page access
- **WHEN** a user loads the homepage
- **THEN** no rate limit counter is incremented

#### Scenario: API request that calls Gemini
- **WHEN** a user submits an image for OCR or text for classification
- **THEN** the rate limit counter increments by 1

### Requirement: Rate limit feedback
The system SHALL inform users of their remaining daily quota in API responses so the frontend can display usage information.

#### Scenario: Remaining quota in response
- **WHEN** a user makes a successful API request
- **THEN** the response headers include the remaining request count for that IP

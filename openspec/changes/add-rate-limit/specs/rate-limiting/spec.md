## ADDED Requirements

### Requirement: IP-based request quota on protected endpoints

The system SHALL enforce a per-IP request quota on the protected API endpoints `/api/ocr`, `/api/parse`, and `/api/analyze`. The three endpoints SHALL share a single quota bucket per IP. The quota SHALL be 30 requests per rolling fixed 1-hour window. Requests exceeding the quota SHALL be rejected with HTTP status 429.

#### Scenario: Request within quota succeeds

- **WHEN** an IP has made fewer than 30 requests to any combination of the protected endpoints within the current 1-hour window
- **THEN** the system SHALL process the request normally and increment the IP's counter by 1

#### Scenario: Request exceeding quota is rejected

- **WHEN** an IP has already made 30 requests to the protected endpoints within the current 1-hour window and sends another request
- **THEN** the system SHALL respond with HTTP 429 and SHALL NOT invoke the underlying handler

#### Scenario: Quota shared across protected endpoints

- **WHEN** an IP has made 30 requests distributed across `/api/ocr`, `/api/parse`, and `/api/analyze` in any combination within the current window
- **THEN** the next request to any of these endpoints SHALL be rejected with HTTP 429

#### Scenario: Quota resets after window expires

- **WHEN** the 1-hour window for an IP has elapsed since its first counted request
- **THEN** the system SHALL reset that IP's counter to zero and the next request SHALL be counted as the first request of a new window

### Requirement: 429 response format

When the system rejects a request due to rate limiting, it SHALL return an HTTP 429 response that includes:

- A JSON body with fields `error` (string, value `"rate_limited"`), `message` (human-readable string), and `retryAfter` (integer seconds until the window resets)
- A `Retry-After` HTTP header containing the same seconds value as `retryAfter`

#### Scenario: Rejected response body contains retry information

- **WHEN** the system rejects a request due to the quota being exceeded
- **THEN** the response body SHALL be a JSON object `{ "error": "rate_limited", "message": <string>, "retryAfter": <positive integer> }`
- **AND** the response SHALL include a `Retry-After` header whose value equals the `retryAfter` field

### Requirement: Development environment bypass

The rate limit SHALL be completely disabled when `process.env.NODE_ENV` is not equal to `"production"`. In this mode the system SHALL NOT count requests, SHALL NOT reject any request due to rate limiting, and SHALL NOT add `Retry-After` headers.

#### Scenario: Non-production environment allows unlimited requests

- **WHEN** the server is running with `NODE_ENV` set to any value other than `"production"`
- **THEN** the system SHALL process every request to the protected endpoints without consulting or updating the rate limit state

#### Scenario: Production environment enforces the limit

- **WHEN** the server is running with `NODE_ENV` set to `"production"`
- **THEN** the system SHALL enforce the quota as defined in the other requirements

### Requirement: Client IP resolution

The system SHALL resolve the client IP from request headers in the following priority order: first entry of `x-forwarded-for` (comma-separated), then `x-real-ip`, then the literal string `"unknown"` as a final fallback. The resolved value SHALL be used as the rate limit key.

#### Scenario: x-forwarded-for is used when present

- **WHEN** an incoming request has header `x-forwarded-for: 203.0.113.5, 10.0.0.1`
- **THEN** the system SHALL use `203.0.113.5` as the rate limit key

#### Scenario: x-real-ip is used when x-forwarded-for is absent

- **WHEN** an incoming request has no `x-forwarded-for` header but has `x-real-ip: 203.0.113.7`
- **THEN** the system SHALL use `203.0.113.7` as the rate limit key

#### Scenario: Unknown fallback when no IP headers present

- **WHEN** an incoming request has neither `x-forwarded-for` nor `x-real-ip` headers
- **THEN** the system SHALL use the literal string `"unknown"` as the rate limit key

### Requirement: In-memory counter storage with lazy cleanup

The system SHALL store rate limit counters in an in-process `Map` keyed by client IP, with each entry containing a count and a window reset timestamp. The system SHALL perform lazy cleanup: on every read, expired entries for the accessed key SHALL be removed; additionally, when the `Map` size exceeds 1000 entries, the system SHALL scan and remove all expired entries during the current write operation.

#### Scenario: Expired entry is removed on access

- **WHEN** a request arrives for an IP whose stored entry has `resetAt` earlier than the current time
- **THEN** the system SHALL delete the stale entry and treat the request as the first request of a new window

#### Scenario: Bulk cleanup triggered past threshold

- **WHEN** a write operation occurs and the `Map` size is greater than 1000 entries
- **THEN** the system SHALL iterate over the `Map` once and remove every entry whose `resetAt` is earlier than the current time before returning

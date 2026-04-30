## ADDED Requirements

### Requirement: Image upload for OCR scanning
The system SHALL provide an image upload control that accepts photos of food packaging ingredient labels. The system SHALL NOT persist uploaded images on the server — images are processed in-memory and discarded after OCR extraction.

#### Scenario: User uploads a valid image
- **WHEN** user selects or captures a photo (JPEG, PNG, or WebP, max 10MB)
- **THEN** the system sends the image to the OCR extraction pipeline and displays a loading state

#### Scenario: User uploads an unsupported file
- **WHEN** user selects a file that is not JPEG, PNG, or WebP, or exceeds 10MB
- **THEN** the system displays an error message indicating the file type or size restriction

### Requirement: Manual text input
The system SHALL provide a textarea where users can manually type or paste food ingredient text.

#### Scenario: User enters ingredient text manually
- **WHEN** user types or pastes text into the textarea and submits
- **THEN** the system sends the text directly to the ingredient parsing pipeline, skipping OCR

#### Scenario: Empty submission
- **WHEN** user submits with no image and no text
- **THEN** the system displays a validation message prompting the user to provide input

### Requirement: Input mode switching
The system SHALL allow users to switch between image upload and text input modes. Only one input mode is active at a time.

#### Scenario: Switch from image to text mode
- **WHEN** user switches to text input mode while an image is loaded
- **THEN** the image is cleared and the textarea becomes active

#### Scenario: Switch from text to image mode
- **WHEN** user switches to image upload mode while text is entered
- **THEN** the text is cleared and the image upload control becomes active

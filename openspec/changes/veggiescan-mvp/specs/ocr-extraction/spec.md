## ADDED Requirements

### Requirement: Extract text from food packaging images
The system SHALL send uploaded images to Gemini 2.5 Flash with a prompt that extracts raw ingredient text. The OCR extraction SHALL support Chinese, English, and Japanese characters.

#### Scenario: Clear image with readable text
- **WHEN** user uploads a clear photo of a food ingredient label
- **THEN** the system returns the extracted raw text preserving the original language and character content

#### Scenario: Image with mixed languages
- **WHEN** user uploads an image containing Chinese, English, and Japanese text
- **THEN** the system extracts all text regardless of language

#### Scenario: Image with poor quality or unreadable text
- **WHEN** the image is blurry, dark, or the text is too small to read
- **THEN** the system returns whatever text it can extract and indicates that OCR confidence may be low

### Requirement: OCR result verification
The system SHALL display the raw OCR-extracted text to the user before proceeding to ingredient parsing. The user SHALL be able to edit the extracted text to correct OCR errors before submitting for analysis.

#### Scenario: User reviews and accepts OCR result
- **WHEN** OCR extraction completes and the user reviews the displayed text
- **THEN** the user can submit the text as-is to proceed to ingredient parsing

#### Scenario: User corrects OCR errors
- **WHEN** OCR extraction contains mistakes (e.g., misread characters)
- **THEN** the user can edit the text in-place and submit the corrected version

### Requirement: OCR error handling
The system SHALL handle Gemini API failures gracefully during OCR extraction.

#### Scenario: Gemini API returns an error
- **WHEN** the Gemini API call fails (network error, rate limit, server error)
- **THEN** the system displays an error message and allows the user to retry or switch to manual text input

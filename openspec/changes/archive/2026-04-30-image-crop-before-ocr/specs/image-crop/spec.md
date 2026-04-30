## ADDED Requirements

### Requirement: Crop UI display

After selecting or capturing an image, the system SHALL present a crop interface that displays the full image and allows the user to select a rectangular region of interest.

#### Scenario: Crop UI appears after image selection

- **WHEN** user selects or captures a photo in image input mode
- **THEN** the system SHALL display the crop interface with the full image loaded

#### Scenario: Crop UI shows confirm and cancel actions

- **WHEN** the crop interface is displayed
- **THEN** the system SHALL show a confirm button to proceed with the cropped area and a cancel button to return to image selection

### Requirement: Pan and zoom gestures

The crop interface SHALL support drag-to-pan and pinch-to-zoom gestures on touch devices, and drag-to-pan and scroll-to-zoom on desktop.

#### Scenario: User zooms in on mobile

- **WHEN** user performs a pinch-to-zoom gesture on the crop interface
- **THEN** the image SHALL zoom in or out following the gesture

#### Scenario: User pans the image

- **WHEN** user drags the image within the crop interface
- **THEN** the visible region SHALL pan to follow the drag direction

### Requirement: Free aspect ratio cropping

The crop interface SHALL allow the user to select a crop area without a fixed aspect ratio constraint, since ingredient label regions vary in shape.

#### Scenario: User selects a tall narrow region

- **WHEN** user adjusts the crop area to a tall narrow rectangle
- **THEN** the system SHALL accept the selection without enforcing a fixed aspect ratio

#### Scenario: User selects a wide short region

- **WHEN** user adjusts the crop area to a wide short rectangle
- **THEN** the system SHALL accept the selection without enforcing a fixed aspect ratio

### Requirement: Client-side crop image generation

When the user confirms the crop selection, the system SHALL produce a cropped image entirely on the client side using an HTML Canvas element. The cropped image SHALL be a base64 data URL.

#### Scenario: User confirms crop

- **WHEN** user taps the confirm button on the crop interface
- **THEN** the system SHALL generate a base64 data URL containing only the pixels within the selected crop area
- **AND** the system SHALL send the cropped image to the OCR API

### Requirement: Cancel crop returns to image selection

When the user cancels the crop, the system SHALL return to the image selection state and discard the current image.

#### Scenario: User cancels crop

- **WHEN** user taps the cancel button on the crop interface
- **THEN** the system SHALL return to the input state
- **AND** the previously selected image SHALL be discarded

### Requirement: Crop state in app state machine

The app state machine SHALL include a `cropping` state between `input` and `ocr-loading`. When a user selects an image in image mode, the app SHALL transition to `cropping` state instead of waiting for "開始分析".

#### Scenario: State transition from input to cropping

- **WHEN** user selects or captures an image in image input mode
- **THEN** the app state SHALL transition to `cropping`

#### Scenario: State transition from cropping to OCR

- **WHEN** user confirms the crop area
- **THEN** the app state SHALL transition to `ocr-loading` and begin OCR processing with the cropped image

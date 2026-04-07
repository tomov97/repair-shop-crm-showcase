# Design System Foundations

## Design Goals

- Make the app feel calm, clear, and trustworthy.
- Support very fast use on mobile at the counter.
- Preserve strong usability on laptop for search and record management.
- Keep the visual language consistent from the first implementation pass.

## Language Rule

All user-facing product text must be in Bulgarian.

This includes:
- navigation
- form labels
- placeholders
- validation messages
- action buttons
- empty states
- search results
- archive and reprint text

Engineering-facing artifacts remain in English.

## Color Tokens

- Primary: `#23443f`
- Surface: `#f8f6eb`
- Text on dark surfaces: `#ffffff`
- Text on light surfaces: `#000000`

Use contrast responsibly. Do not force white or black text when readability suffers.

## UI Principles

- Mobile-first interaction design
- Clean, low-stress forms
- Large tap targets
- Minimal unnecessary chrome
- Strong emphasis on the primary action for each screen

## Mobile Rules

- One-column layouts by default
- Sticky primary actions when useful
- Camera-friendly QR entry points
- Fast keyboard behavior and sensible input modes
- Avoid dense tables and overly small text

Mobile must support the same core product capabilities as desktop:
- create intake
- search
- open by QR
- edit
- archive
- reprint

## Desktop Rules

- Support denser browsing of active records
- Keep search prominent
- Allow longer lists and more visible secondary metadata
- Keep admin/settings screens desktop-friendly

Desktop can be stronger for:
- long lists
- denser scanning of records
- settings and operational visibility

## Visual Tone

- Clean and practical rather than flashy
- Warm and professional rather than corporate
- Stable and readable rather than highly experimental

## Component Guidelines

### Buttons

- Primary actions should be visually obvious
- Destructive actions should be visually restrained because v1 avoids hard deletes
- Reprint and archive actions should be easy to find from intake detail screens

### Forms

- Keep required fields short and obvious
- Use sensible defaults for phone entry
- Prefer clarity over compactness

### Lists

- Default active-intake list should show:
  - customer name
  - phone number
  - brand
  - model
  - intake number

### Search

- One universal search box
- Current records ranked before archived records
- Search UI should stay fast and prominent on both phone and laptop

## Label Design Rules

The physical label must include:
- company logo
- QR code
- intake number

Design the label for scanning reliability:
- high contrast
- enough whitespace around the QR code
- no unnecessary visual clutter

## Accessibility Baseline

- readable contrast
- clear focus states
- large enough tap targets
- no color-only meaning for critical states

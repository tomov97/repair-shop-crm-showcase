# Product Specification v1

## Purpose

Build a lightweight internal CRM for a repair shop that makes it easy to:
- create a new intake from a phone or laptop
- print a label immediately after intake
- retrieve the exact intake by scanning the label QR code
- search current and archived records quickly
- archive completed repairs with the charged amount

The system must be simple enough for daily use by a small family business and reliable enough to become the long-term system of record.

## Product Goals

- Minimize friction at intake time.
- Make label printing automatic and recoverable.
- Make retrieval fast through QR and search.
- Keep the first version intentionally narrow.
- Support both mobile and desktop with the same core capabilities.

## Non-Goals

The following are explicitly out of scope for v1:
- workflow stages
- task lists or reminders
- automated messaging
- customer-facing pages
- intake photos
- advanced analytics
- machine identity matching across visits

## Supported Users

- Internal shop users only
- Expected usage: 1-2 family/staff users

## Primary Flows

## 1. Create Intake

1. User opens the app on phone or laptop.
2. User fills in the intake form.
3. User submits the intake.
4. System saves the intake first.
5. System generates:
   - intake number
   - QR scan token
   - label asset
   - queued print job
6. If the print host is available, the label prints immediately.
7. If printing fails, the intake remains saved and visibly marked for reprint.

## 2. Retrieve by QR

1. User scans the QR code with the phone camera or from inside the app.
2. QR opens the exact intake route.
3. If the user is authenticated, open the intake directly.
4. If the user is not authenticated, show login and then redirect back to the intake.

## 3. Retrieve by Search

Users can search from mobile or desktop using a single universal search box.

Search must prioritize:
- phone number
- customer name
- intake number

Search must include both current and archived records, while ranking current records first.

## 4. Archive Intake

1. User opens an active intake.
2. User marks it as finished.
3. User enters the charged amount.
4. System moves the intake from current to archive.

v1 does not require pickup date, repair summary, or stage transitions during archive.

## Required Intake Fields

- customer name
- phone number
- brand
- model
- issue description

## Optional v1 Fields

- free-form notes

## Customer Matching Rules

- Normalize phone numbers before matching.
- Default phone behavior should support Bulgarian formatting, but allow non-Bulgarian numbers when needed.
- Auto-link to an existing customer only when both normalized phone number and customer name match.
- If only one of those matches, require manual confirmation before linking.
- One customer may have many intakes.

## Record Rules

- One intake equals one machine.
- Each intake has its own intake number.
- Each intake has its own QR token and label.
- Basic editing is allowed after creation.
- No hard delete in v1.

## Label Rules

The printed label must contain:
- company logo
- QR code
- intake number

The QR code must not embed raw customer personal data.

## Print Trigger Rules

A print job is queued in exactly two cases:

1. **Automatic** — when a new intake is submitted. One job is created immediately as part of intake creation.
2. **Manual reprint** — when a user presses the print button on a specific intake's detail page. Each press queues one new job.

No other code paths should create print jobs. The print agent picks up queued jobs, attempts each once, and marks the result printed or failed. Failed jobs are never auto-retried — the user must press the reprint button again if needed.

## UI Language Rule

All user-facing text must be in Bulgarian, including:
- labels
- buttons
- form field labels
- placeholders
- validation errors
- navigation text
- archive/reprint/status text

Repository documentation, code, comments, and engineering decisions remain in English.

## Success Criteria

v1 is successful when a user can:
- create a repair intake quickly from a phone
- receive an automatic printed label
- stick the label on the machine
- later retrieve the exact intake by scanning the QR or searching
- archive the repair with the charged amount

without needing a stage system, reminders, or customer messaging.

# Project Agreements

This document captures the product, technical, and operational decisions agreed so far. It is intended as a single handoff reference for future implementation work.

## Product Direction

- This is an internal CRM for a small family repair business.
- v1 is intentionally narrow: `intake -> save -> print label -> retrieve by QR/search -> archive with charged amount`.
- The product is meant to become the long-term system of record for the business.
- Reliability is prioritized over feature breadth and automation in v1.

## v1 Scope

Included:
- create an intake from phone or laptop
- store the intake in the database
- automatically generate and queue a label after save
- retrieve a record by QR scan or search
- allow basic edits after creation
- keep a `current` and `archive` split
- capture charged amount when archiving
- allow label reprint

Excluded from v1:
- workflow stages
- task lists or reminders
- messaging automation
- customer-facing portal
- intake photos
- advanced reporting

## Intake and Customer Logic

- One intake equals one machine.
- Returning-customer history is customer-first, not machine-first.
- Auto-link a new intake to an existing customer only when:
  - normalized phone number matches
  - customer name matches
- If only one of those conditions matches, require manual confirmation.
- Phone handling is Bulgaria-first but should allow non-`+359` numbers when needed.
- Required intake fields:
  - customer name
  - phone number
  - brand
  - model
  - issue description
- Issue description is free text.
- Brand and model are separate structured fields.
- Basic editing is allowed after creation.
- No hard deletes.

## Search and Retrieval

- The main laptop home screen should show the current active intakes list.
- Default active-list order is newest first.
- Each active intake row should show:
  - customer name
  - phone number
  - brand
  - model
  - intake number
- Search should be a single universal search box.
- Search should prioritize:
  - phone number
  - customer name
  - intake number
- Search should include both current and archived records, with current results shown first.
- Scanning a QR code should open the intake directly.
- Customer history should exist but stay behind a tab or button instead of dominating the intake screen.

## Archive Behavior

- `Current` means the machine is still in the shop.
- `Archive` means the machine is finished and no longer active.
- Archiving requires entering the charged amount.
- Pickup date is not required in v1.
- Repair summary is not required in v1.

## Label and QR

- The label must include:
  - company logo
  - QR code
  - intake number
- QR must open the exact intake through a login-gated route.
- QR must not contain raw customer data.
- Intake number exists as the human fallback when QR scanning fails.
- The current logo asset is `logo.png` in the repo root.

## Printing and Reliability

- Reliability is the top operational priority.
- Direct phone-to-printer printing is not the main architecture.
- Printing goes through a Windows print host during work hours.
- The printer should sit near that machine.
- USB is the default reliability-first assumption.
- The printer is a Brother QL-800 connected via USB.
- A Wi-Fi-capable Brother printer is acceptable later if needed, but not required for the architecture.
- Intake must always save before printing.
- Printing happens through a queued `print_jobs` model.
- If printing fails, the intake remains saved and should show a reprint-needed state.
- Reprint should be available from the intake page.
- If the wrong label is attached, staff should find the correct intake and reprint it.
- A print job may be marked successful when the print agent reports the job was sent to the printer.
- If the shop PC is unavailable, intake should still work and labels can be printed later.

## Offline and Data Safety

- Basic offline queueing for intake is desired.
- Full offline-first behavior is not required in v1.
- Duplicate submissions should be blocked automatically.
- Key edits should be quietly tracked through audit history.
- Automatic backups are preferred.
- Export tools can wait until later.
- No hard delete for customers or intakes.

## Mobile and Desktop

- Mobile must be as good as desktop in terms of core capability.
- Both mobile and desktop must support:
  - intake
  - QR open
  - search
  - edit
  - archive
  - reprint
- UX should be adapted per device rather than visually identical.
- Desktop can be stronger for:
  - long dense lists
  - admin and settings screens

## Language and Design

- The shipped app UI must be entirely in Bulgarian.
- The repo, code, comments, and docs remain in English.
- Theme colors:
  - `#23443f`
  - `#f8f6eb`
- White or black text should be used based on contrast.

## Auth and Security

- Auth mode for v1 is email/password.
- The app is internal-only for family/staff users.
- QR routes require login before showing ticket data.
- There are no public customer-facing ticket pages in v1.

## Tech Stack

- Monorepo using npm workspaces
- Web app: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Forms and validation: React Hook Form + Zod
- Backend: Supabase
- Print agent: separate Node.js TypeScript Windows worker

## Current Repo State

- Product and architecture documentation is in place.
- The web app scaffold exists.
- The print-agent scaffold exists.
- Supabase env values are mapped locally.
- The logo asset is present in the repo.

## Still TBD

- Final production hosting and domain
- SMTP or custom email setup if needed later
- Future automation features such as Viber messaging and workflow auto-moves

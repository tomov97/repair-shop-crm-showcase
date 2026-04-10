# Implementation Roadmap

> **Status:** All phases complete. The app is built and deployed.

## Goal

Build the first working product increment in a safe order that preserves the reliability-first decisions already made.

## Phase 0: Documentation Baseline (done)

- Finalize the repository foundation documents.
- Keep the docs as the source of truth for v1.
- Do not begin feature work until the documentation is accepted.

## Phase 1: App Scaffold (done)

- Create the npm workspace scaffold.
- Set up the Next.js 16 web app.
- Set up the Windows print-agent package.
- Establish the base layout for mobile and desktop.
- Add theme tokens and the Bulgarian-only UI text rule.
- Set up the initial authentication shell.

## Phase 2: Data and Backend Foundation (done)

- Create the initial database schema.
- Add customer and intake creation flows.
- Add normalized phone handling.
- Add safe customer matching behavior.
- Add archive support with charged amount.
- Add audit events for key changes.

## Phase 3: Intake Flow (done)

- Build the intake form for mobile and desktop.
- Implement create-intake submission.
- Generate intake number and scan token on the backend.
- Add duplicate submission protection.

## Phase 4: QR and Retrieval (done)

- Implement QR route resolution.
- Add intake detail screen.
- Add universal search for phone, name, and intake number.
- Add active/archive result handling with current-first ranking.

## Phase 5: Label Generation and Printing (done)

- Generate print-ready labels with company logo, QR code, and intake number.
- Add queued print job creation after intake save.
- Implement the Windows print host worker.
- Add print success and failure tracking.
- Add reprint from the intake detail page.

## Phase 6: Reliability Pass (done)

- Add visible print failure states.
- Add offline intake queue behavior for mobile.
- Validate delayed print recovery.
- Validate PC downtime behavior.
- Validate damaged-label recovery through search and reprint.

## Phase 7: Acceptance and Hardening (done)

- Test the core mobile flow end to end.
- Test the core desktop flow end to end.
- Test repeat-customer matching rules.
- Test archive behavior and charged amount capture.
- Test label scan behavior with real printed labels.

## Definition of Ready for Feature Work

Implementation can start when:
- documentation is consistent
- the v1 scope is frozen enough to scaffold safely
- the first build order is agreed

## Definition of Done for the First Product Increment

The first meaningful product increment is complete when a user can:
- create an intake
- have it saved reliably
- get a printed label or a recoverable print failure state
- retrieve the intake through QR or search
- archive the intake with the charged amount

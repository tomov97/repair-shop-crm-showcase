# Repository Instructions

This repository is for a repair-shop CRM and label-printing system. Follow these instructions for every task in this repo.

## Core Rules

- Keep all repository artifacts in English.
- Keep all user-facing app copy in Bulgarian.
- Preserve the v1 scope defined in `docs/spec-v1.md`.
- Prefer small, verifiable changes over broad speculative work.
- Do not introduce workflow stages, task automation, messaging automation, customer portals, or intake photos in v1 unless explicitly requested.

## Product Constraints

- Reliability-first architecture is mandatory.
- Intake data must be saved before any print attempt.
- Printing must happen through a queued job model.
- The shop Windows PC is the print host during working hours.
- Print failures must never destroy or block saved intake data.
- No hard delete flows for business records.
- The concrete v1 stack is Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase, and a separate Node.js Windows print agent.

## UX Constraints

- Mobile and desktop must support the same core capabilities.
- Adapt layouts by device instead of forcing identical UI.
- Long dense lists and admin/settings can be stronger on desktop.
- Theme colors are `#23443f` and `#f8f6eb`.
- Use white or black text only when contrast is appropriate.

## Data Constraints

- One intake equals one machine.
- Required intake fields are customer name, phone number, brand, model, and issue description.
- Auto-link a returning customer only when both normalized phone number and name match.
- If only one matches, require manual confirmation.
- Archive flow must capture the charged amount.

## Working Style

- Read the relevant files in `docs/` before making non-trivial changes.
- Use the root npm workspace scripts instead of one-off per-folder commands when possible.
- Keep comments short and useful.
- Validate your work with the most relevant checks available.
- Call out assumptions when local context is incomplete.

## Done Means

- The change matches the documented v1 scope.
- The change preserves Bulgarian-only UI copy.
- The change preserves reliability-first behavior.
- The change is tested or explicitly notes what could not be tested.

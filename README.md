# CRM Kafemashini Label Maker

This repository contains the v1 foundation for a repair-shop CRM focused on fast intake, reliable label printing, and easy retrieval of active and archived repair records.

The product is intended for a small family business and is optimized for:
- very fast intake on mobile
- reliable day-to-day use on a shop laptop
- automatic QR label printing after intake submission
- easy record retrieval through QR scan or search
- low operational complexity

## Product Principles

- User-facing app copy must be entirely in Bulgarian.
- Repository artifacts stay in English.
- Reliability is more important than maximum automation in v1.
- Intake must be saved before printing.
- Print failures must be recoverable without losing intake data.
- Mobile and desktop must offer the same core capabilities, with device-specific UX.

## v1 Scope

Included in v1:
- intake creation for one machine per record
- customer matching with controlled auto-linking
- QR label generation and queued printing
- search by phone, customer name, and intake number
- direct record opening via QR scan
- basic record editing
- current/archive split
- charged amount captured when archiving
- label reprint flow

Out of scope for v1:
- kanban/stage workflow
- tasks and reminders
- messaging automation
- customer-facing portal
- intake photos
- advanced analytics and reporting

## Concrete v1 Stack

- Monorepo: npm workspaces
- Web app: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Form and validation: React Hook Form + Zod
- Backend: Supabase for Postgres, auth, storage, and server-side integration
- Print host: Node.js TypeScript worker on a Windows PC during work hours
- Printer: USB-connected label printer near the print host

The technical details and product decisions are documented in the `docs/` directory.

## Repository Structure

```text
.
|-- .codex/
|   `-- config.toml
|-- apps/
|   |-- print-agent/
|   `-- web/
|-- docs/
|   |-- architecture.md
|   |-- data-model.md
|   |-- design-system.md
|   |-- implementation-roadmap.md
|   |-- operations.md
|   `-- spec-v1.md
|-- package.json
|-- tsconfig.base.json
|-- AGENTS.md
`-- README.md
```

## Working Agreement

- Start implementation only after the documentation baseline is agreed.
- Keep product decisions in the docs rather than scattering them across chat history.
- Treat the docs as the source of truth for the first implementation pass.

## Local Setup

Install dependencies from the repository root:

```bash
npm install
```

Start the web app:

```bash
npm run dev:web
```

Start the print agent:

```bash
npm run dev:print-agent
```

Populate environment variables from:
- `apps/web/.env.example`
- `apps/print-agent/.env.example`

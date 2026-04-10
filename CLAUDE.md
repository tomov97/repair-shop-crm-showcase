# CRM Kafemashini Label Maker

Repair-shop CRM with label printing. Internal tool for a small family business.

## Quick Reference

- **Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase, Node.js print agent
- **Monorepo**: npm workspaces — `apps/web` (PWA) and `apps/print-agent` (Windows worker)
- **DB**: Supabase Postgres — tables: `customers`, `intakes`, `print_jobs`, `audit_events`
- **Printer**: Brother QL-800 connected via USB to a Windows desktop
- **Theme colors**: `#23443f` (dark green) and `#f8f6eb` (cream)

## Rules

- All user-facing text: **Bulgarian only**
- All code, comments, docs: **English**
- Reliability-first: save intake data before any print attempt
- Printing is a queued background job; failures never block intake creation
- Print jobs are created in exactly two places: (1) new intake submission, (2) manual reprint button on intake detail page — nowhere else
- The print agent attempts each job once; failed jobs are never auto-retried (user must reprint manually)
- No hard deletes for business records
- One intake = one machine
- Stick to v1 scope in `docs/spec-v1.md` — no workflow stages, task automation, messaging, customer portals, or intake photos

## Key Commands

```bash
npm run dev          # start web app
npm run dev:print-agent  # start print agent
npm run build        # build all
npm run lint         # lint web
npm run typecheck    # typecheck all
```

## Architecture

1. User submits intake form (mobile or desktop)
2. Server saves intake, generates intake number + QR scan token + label asset + print job
3. Print agent polls Supabase for queued jobs, downloads label, prints via OS driver
4. Dashboard shows print status — flags unprinted labels
5. QR scan opens `/t/{scanToken}` which resolves to intake detail (login-gated)

## Code Map

### `apps/web/src/lib/` — server-side data layer
- `intakes.ts` — all intake CRUD, dashboard data, print job creation, customer matching
- `dashboard-data.ts` — intake directory queries, trend series, print queue
- `auth.ts` — getCurrentUser (cached), requireUser (redirects)

### `apps/web/src/app/` — Next.js pages (server components + Suspense streaming)
### `apps/web/src/components/` — UI components (client components only where needed)
### `apps/web/src/app/actions/` — server actions (form submissions)
### `apps/web/src/app/api/` — API routes (search, label generation)
### `apps/print-agent/` — Windows polling worker (standalone Node.js process)

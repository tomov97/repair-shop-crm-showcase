# Coffee Machine Repair CRM

![Log it on the phone. The label prints itself.](docs/screenshots/01-cover.png)

A custom CRM for a family repair business, built from scratch. It replaced a paper-ticket workflow with a system that prints a QR label for every machine that comes through the door, and pulls up that machine's full history when the label is scanned.

> **This is the English demo build** of a system running in production for a Bulgarian repair shop. The production UI is in Bulgarian; this branch translates it and runs against seeded demo data so the code and the interface can be read by anyone. No customer data is included.

## The problem it solves

The shop ran on handwritten tickets taped to machines. Three things went wrong constantly:

- **Tickets went missing.** A machine on the bench with no paper meant reconstructing the job from memory.
- **Disputes had no evidence.** Customers argued about what was repaired, when, and for how much. There was no record to point at.
- **Lookup was manual.** Answering "what did you do to my machine last spring?" meant digging through a physical archive.

## How it works

![Architecture: intake data is saved before anything prints](docs/screenshots/09-architecture.png)

The ordering is the whole design. **Intake data is committed before any print attempt.** A jammed printer, an offline PC, or a bad USB cable produces a failed job row and nothing else. The record is already safe, and staff reprint with one tap.

Print jobs are attempted exactly once and never auto-retried. Silent retries against a physical printer produce duplicate labels on a customer's machine, which is worse than a visible failure.

## Features

- **Fast mobile intake.** One machine per record, phone-first form, customer auto-matching by normalized phone number.
- **Automatic QR label printing** to a Brother QL-800 over USB.
- **Scan to open.** The QR resolves to a login-gated record page.
- **Before/after photos**, compressed client-side to WebP and stored in Cloudflare R2 with presigned reads.
- **Search** by customer, phone, machine, or intake number.
- **Active / archive split**, with the charged amount captured on archive.
- **Sales records** alongside repairs, sharing the same table via a discriminator column with DB-enforced constraints.
- **Audit log** of every state change, stored in `audit_events`.
- **Print queue view** showing queued, printing, printed, and failed jobs with the underlying error.

## Screenshots

**1. Intake on the phone.** A new repair is logged in under a minute. Returning customers are matched by phone number.

<img src="docs/screenshots/02-intake-mobile.png" width="320" alt="Mobile intake form">

**2. The label.** Printed automatically on a Brother QL-800 at the counter: intake number plus a QR code.

<img src="docs/screenshots/03-label.png" width="480" alt="Printed QR label">

**3. Scan the label.** Any logged-in phone opens the machine's record, including every earlier visit.

<img src="docs/screenshots/04-scan-record-mobile.png" width="320" alt="Record opened from a QR scan">

**4. Before/after photos.** Taken at intake and at pickup, so disputes about the machine's condition have evidence.

<img src="docs/screenshots/05-photos.png" width="560" alt="Before and after photos on a record">

**5. Repair history.** Earlier intakes for the same customer, one tap away.

<img src="docs/screenshots/06-history.png" width="560" alt="Previous intakes">

**6. Dashboard.** Active repairs grouped by day, filterable by date range.

![Active records dashboard](docs/screenshots/07-dashboard.png)

**7. Print queue.** A failed print shows the printer's error and never affects the saved record. Staff reprint with one tap.

![Print queue with a failed job](docs/screenshots/08-print-queue.png)

## Architecture

npm workspaces monorepo.

| Path | What it is |
| --- | --- |
| `apps/web` | Next.js 16 App Router PWA. Server components with Suspense streaming, server actions for mutations. |
| `apps/print-agent` | Standalone Node.js worker on the shop's Windows PC. Polls for queued jobs, prints, reports back. |
| `supabase/migrations` | Ordered SQL migrations. Business rules live in DB constraints, not just app code. |

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase (Postgres + Auth), Cloudflare R2, Node.js.

### Decisions worth calling out

**Constraints in the database, not the application.** Sales records can never be archived, and service records always require a problem description. Both are `CHECK` constraints, so a bug in the app cannot violate them. See `supabase/migrations/202604170001_harden_intake_type_constraints.sql`.

**Intake numbers come from a Postgres sequence.** The original implementation used a retry loop against a daily counter, which is a race under concurrent intake. A sequence is atomic and never resets, which also let the shop continue its old paper numbering without a gap.

**No silent defaults on filtered queries.** The directory RPC originally defaulted `p_intake_type` to `'service'`. That default was dropped so a forgotten filter fails loudly instead of silently returning partial data.

**No hard deletes.** Business records are archived or soft-deleted. Photos carry `deleted_at` rather than being removed.

## Running the demo locally

You need a throwaway Supabase project. Do not point this at anything real.

```bash
npm install

# 1. Apply the schema to your demo project
npx supabase db push --db-url "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"

# 2. Configure
cp apps/web/.env.demo.example apps/web/.env.demo   # then fill it in

# 3. Seed realistic demo data
node scripts/seed-demo.mjs

# 4. Run
npm run dev
```

Then open `http://localhost:3000/setup` to create the first account.

The seed script generates ~60 intakes weighted across the last six months, so the trend chart and pagination show real shape rather than an empty state.

## Commands

```bash
npm run dev              # web app
npm run dev:print-agent  # print agent
npm run build            # build all
npm run lint             # lint web
npm run typecheck        # typecheck all
```

## Built with Claude Code

The entire system was designed and implemented with [Claude Code](https://claude.com/claude-code) as the primary development environment, including the schema design, the print pipeline, and the hardware integration debugging.

## Credits

Demo photos from Wikimedia Commons: "Tunbow coffee machine brew group" and "Tunbow coffee machine brew group unit" by Blackeyelion (CC BY 4.0); "Saeco (LRM 20250919 142538)" and "Saeco (LRM 20250919 142532)" by Matti Blume (CC BY-SA 4.0). All customer names and phone numbers are fictional.

# Architecture

## Overview

The system uses a reliability-first architecture with a clear separation between:
- data capture
- record storage
- label generation
- print execution

The application is designed for a small shop with one shared print station.

## High-Level Components

- Responsive PWA built with Next.js 16 App Router
- Supabase backend for auth, database, storage, and APIs
- Windows print host running a Node.js TypeScript worker during shop hours
- USB-connected label printer near the print host

## Core Design Rules

- Save intake before printing.
- Treat printing as a queued background operation.
- Keep QR retrieval login-gated.
- Never block business record creation on printer success.

## Request Flow

## Intake Submission

1. Client submits intake from mobile or desktop.
2. Backend validates and saves the intake.
3. Backend generates:
   - intake number
   - scan token
   - print-ready label asset
   - print job record
4. Print host polls for queued jobs.
5. Print host downloads the label asset and sends it to the printer.
6. Print host records success or failure.

## QR Retrieval

1. User scans the printed QR code.
2. App opens `/t/{scan_token}`.
3. Backend resolves the token to an intake.
4. If authenticated, show the intake.
5. If unauthenticated, require login and redirect back afterward.

## Printing Model

Printing is deliberately host-driven instead of phone-driven.

Reasons:
- avoids mobile Bluetooth and browser print instability
- makes the intake workflow independent from printer connectivity details
- creates one predictable print point for the shop
- supports easy reprint from any device

## Print Host Responsibilities

- poll for queued print jobs
- claim each job atomically (queued → printing)
- fetch label asset, rasterize, and send to the OS printer driver
- mark job printed on success, failed + last_error on error
- never auto-retry failed jobs (user must trigger a manual reprint)
- avoid duplicate completion writes

The print host is not the system of record. It is an operational worker connected to the main backend.

## Concrete Technology Choices

- Frontend framework: Next.js 16
- UI runtime: React 19
- Language: TypeScript
- Styling: Tailwind CSS 4 plus app-level theme tokens
- Forms: React Hook Form
- Validation: Zod
- Backend platform: Supabase
- Print worker runtime: Node.js on Windows

## Availability Model

- The app should work on mobile and desktop.
- During shop hours, the print host should remain on and connected.
- If the print host is unavailable, intake creation must still work.
- Failed or delayed print jobs must remain reprintable later.

## Offline Behavior

v1 supports a basic offline intake queue on the client side:
- temporary mobile offline capture is allowed
- sync happens when connectivity returns
- printing starts only after a successful server sync

This is not a full offline-first system.

## Security Model

- Internal users only
- Authenticated access required for intake detail pages
- QR codes must carry only a tokenized route
- No public customer-facing ticket pages in v1

## Why This Architecture Fits v1

This architecture keeps the system simple while preserving long-term reliability:
- one source of truth
- one predictable print path
- recoverable printing
- mobile and desktop parity
- room for later automation without changing the core model

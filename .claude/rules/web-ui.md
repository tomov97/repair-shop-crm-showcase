---
paths:
  - "apps/web/src/app/**"
  - "apps/web/src/components/**"
---

- All user-facing text must be in Bulgarian. Code/comments in English.
- Pages use Suspense streaming: AppShell renders from auth alone, data sections are async server components wrapped in `<Suspense>`.
- Minimize client components — only use `"use client"` for interactivity (forms, search bar, charts).

---
paths:
  - "apps/web/src/app/**"
  - "apps/web/src/components/**"
---

- All user-facing text must be in Bulgarian. Code/comments in English.
  (Exception: the `demo-en` showcase branch is translated to English on purpose. Never merge it into `main`.)
- Pages use Suspense streaming: AppShell renders from auth alone, data sections are async server components wrapped in `<Suspense>`.
- Minimize client components — only use `"use client"` for interactivity (forms, search bar, charts).

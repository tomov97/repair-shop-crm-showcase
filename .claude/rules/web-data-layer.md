---
paths:
  - "apps/web/src/lib/**"
---

- Use Supabase PostgREST joins (`customers ( full_name, display_phone )`) to avoid multiple round-trips. Never add waterfall queries.
- Print jobs are created in exactly two places: (1) intake submission in `createIntake()`, (2) manual reprint in `requeuePrintJob()`. Nowhere else.
- Customer matching: normalize phone → exact match → auto-link. Only prompt user if ambiguous.

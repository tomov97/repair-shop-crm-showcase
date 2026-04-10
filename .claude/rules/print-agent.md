---
paths:
  - "apps/print-agent/**"
---

- Each job attempted once; failed jobs are never auto-retried (user reprints manually).
- `WEB_BASE_URL` env var must match the web app's URL for QR codes on labels to work.
- Windows system print ticket must match label dimensions exactly (62mm continuous) or prints will be wrong size.

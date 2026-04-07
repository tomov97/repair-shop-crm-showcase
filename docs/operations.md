# Operations and Reliability

## Reliability Goals

The system should remain usable in a real shop even when:
- internet is temporarily weak
- a user taps submit twice
- the print host is down
- the printer is disconnected or out of labels
- a label is damaged

The main rule is simple: never lose intake data.

## Backup Strategy

- Use automatic managed-backend backups.
- Do not depend on manual human exports for baseline safety.
- Add manual export later as a convenience feature, not as the primary recovery plan.

## Failure Handling

## Intake Save vs Print

- Intake save is the critical transaction.
- Printing is a separate queued operation.
- An intake must remain valid even if printing fails.

## Duplicate Submission Protection

The client should send a submission token for each intake attempt.

The backend should treat repeated submissions with the same token as the same intake creation request. This prevents duplicate records from double taps or retry storms.

## Print Failure Recovery

If printing fails:
- keep the intake saved
- mark it with a visible reprint-needed state
- allow reprint from the intake page
- preserve error information for troubleshooting

Reprint must not duplicate the intake itself.

## Print Host Downtime

If the shop Windows PC is unavailable:
- intake creation should continue on mobile or desktop
- print jobs should remain queued
- labels should print later when the host returns

The print host is important for automation, but it must not become a data bottleneck.

## Damaged or Lost Label Recovery

If a label cannot be scanned:
- search by phone
- search by customer name
- search by intake number
- reprint from the correct intake

This is one reason the intake number must be printed on the label.

## Offline Intake

v1 allows a basic offline queue for mobile intake:
- create the intake locally
- sync when connectivity returns
- start printing only after server confirmation

v1 does not support a full offline record browser or full offline editing model.

## Edit Safety

Track key changes quietly for:
- customer identity fields
- machine fields
- issue description
- charged amount
- archive state

This keeps the UI simple while preserving trust in the data over time.

## Delete Policy

- No hard delete for customers
- No hard delete for intakes
- No hard delete for print jobs

If future cleanup is needed, use soft-delete or admin-only archival approaches.

## Operational Checklist for v1

- print host starts reliably during work hours
- printer stays physically near the host PC
- print status is visible on affected intakes
- reprint is available from the intake page
- current records are easy to search and open
- archives remain searchable

## Long-Term Readiness

The v1 operational model is intentionally simple, but it leaves room for:
- future messaging automation
- future workflow automation
- future reporting
- future export tools

Those should be added later on top of the stable intake, retrieval, archive, and print model rather than replacing it.

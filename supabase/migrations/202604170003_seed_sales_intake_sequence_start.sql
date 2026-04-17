-- Seed the sales intake number sequence so the first issued sales intake
-- number is PK-DD/MM/YY-007548. Same monotonic, never-resets behavior as the
-- service sequence (see 202604110003).
--
-- setval(seq, 7547, is_called=true) => next nextval() returns 7548.
--
-- Safe to run only when no sales intakes have been created yet (sequence is
-- still at 1). If any sales rows exist, this advance will skip those numbers,
-- which is harmless but visible as a one-time gap.

select setval('public.sales_intake_number_seq', 7547, true);

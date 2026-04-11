-- One-shot cleanup before going live with the new CRM.
-- Everything in the database today is test data and can go.
--
-- Run this in the Supabase SQL editor AFTER the
-- 202604110003_intake_number_sequence migration has been applied, and BEFORE
-- the first real intake is created. It wipes all business rows and resets the
-- intake sequence to the value you configure in `setval` below.
--
-- Order matters because of foreign keys:
--   1. audit_events  (no FKs in, but references intakes/customers by id)
--   2. print_jobs    (FK -> intakes)
--   3. intakes       (FK -> customers)
--   4. customers
--
-- truncate ... restart identity cascade is used so any owned sequences on
-- these tables are also reset. The intake_number_seq is separate and is
-- explicitly set at the bottom.

begin;

truncate table
  public.audit_events,
  public.print_jobs,
  public.intakes,
  public.customers
restart identity cascade;

-- Set the intake counter so the NEXT intake issued is (value + 1).
-- The first new CRM intake must be SC-dd/mm/yy-014869, so the sequence is
-- seeded at 14868 with is_called=true so nextval() returns 14869.
select setval('public.intake_number_seq', 14868, true);

commit;

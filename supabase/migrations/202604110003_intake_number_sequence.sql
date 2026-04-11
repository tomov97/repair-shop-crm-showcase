-- Global monotonic intake number sequence.
-- Intake numbers used to reset to 000001 each day. The shop is migrating from
-- an older paper system whose last issued number must be continued here, and
-- the counter should never reset across days. A Postgres sequence gives us an
-- atomic, concurrency-safe source of numbers without the previous retry loop.
--
-- NOTE: adjust `start with` below to (last_number_from_old_system + 1) before
-- running this migration against production.

create sequence if not exists public.intake_number_seq
  as bigint
  start with 1
  increment by 1
  minvalue 1
  maxvalue 999999
  no cycle;

-- RPC wrapper so the service-role client can advance the sequence via
-- PostgREST. Returns the formatted intake number (SC-dd/mm/yy-NNNNNN) directly
-- to keep the client code trivial and the formatting authoritative in SQL.
create or replace function public.next_intake_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  seq_value bigint;
  local_now timestamptz;
begin
  seq_value := nextval('public.intake_number_seq');
  local_now := timezone('Europe/Sofia', now());
  return 'SC-'
    || to_char(local_now, 'DD/MM/YY')
    || '-'
    || lpad(seq_value::text, 6, '0');
end;
$$;

revoke all on function public.next_intake_number() from public;
grant execute on function public.next_intake_number() to service_role;

alter table public.intakes
  drop constraint if exists archived_amount_required;

alter table public.intakes
  add constraint archived_requires_timestamp check (
    (is_archived = false and archived_at is null)
    or (is_archived = true and archived_at is not null)
  );

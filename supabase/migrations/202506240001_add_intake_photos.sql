create table public.intake_photos (
  id           uuid primary key default gen_random_uuid(),
  intake_id    uuid not null references public.intakes(id),
  photo_type   text not null check (photo_type in ('before', 'after')),
  storage_key  text not null,   -- R2 object key: intakes/{intake_id}/{before|after}/{uuid}.webp
  content_type text not null,
  byte_size    integer not null,
  width        integer,
  height       integer,
  position     integer not null default 0,
  uploaded_by  uuid,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  deleted_by   uuid
);

create index intake_photos_intake_idx
  on public.intake_photos (intake_id)
  where deleted_at is null;

alter table public.intake_photos enable row level security;

create policy "staff_all" on public.intake_photos
  for all
  to authenticated
  using (true)
  with check (true);

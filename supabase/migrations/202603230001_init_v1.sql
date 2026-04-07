create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  normalized_phone text not null,
  display_phone text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.intakes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  intake_number text not null unique,
  scan_token text not null unique,
  brand text not null,
  model text not null,
  issue_description text not null,
  notes text,
  is_archived boolean not null default false,
  charged_amount numeric(12, 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  constraint archived_amount_required check (
    (is_archived = false and charged_amount is null and archived_at is null)
    or (is_archived = true and charged_amount is not null and archived_at is not null)
  )
);

create table if not exists public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.intakes(id),
  label_asset_url text not null,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  printed_at timestamptz,
  constraint print_jobs_status_check check (status in ('queued', 'printing', 'printed', 'failed')),
  constraint print_jobs_attempt_count_check check (attempt_count >= 0)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists customers_normalized_phone_idx on public.customers (normalized_phone);
create index if not exists customers_full_name_lower_idx on public.customers ((lower(full_name)));
create index if not exists intakes_created_at_idx on public.intakes (created_at desc);
create index if not exists intakes_archive_idx on public.intakes (is_archived, created_at desc);
create index if not exists intakes_customer_id_idx on public.intakes (customer_id);
create index if not exists print_jobs_status_idx on public.print_jobs (status, created_at asc);
create index if not exists print_jobs_intake_id_idx on public.print_jobs (intake_id, created_at desc);
create index if not exists audit_events_entity_idx on public.audit_events (entity_type, entity_id, created_at desc);

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

drop trigger if exists intakes_set_updated_at on public.intakes;
create trigger intakes_set_updated_at
before update on public.intakes
for each row
execute function public.set_updated_at();

drop trigger if exists print_jobs_set_updated_at on public.print_jobs;
create trigger print_jobs_set_updated_at
before update on public.print_jobs
for each row
execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.intakes enable row level security;
alter table public.print_jobs enable row level security;
alter table public.audit_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_authenticated_select'
  ) then
    create policy customers_authenticated_select on public.customers
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_authenticated_insert'
  ) then
    create policy customers_authenticated_insert on public.customers
      for insert to authenticated with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_authenticated_update'
  ) then
    create policy customers_authenticated_update on public.customers
      for update to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'intakes' and policyname = 'intakes_authenticated_select'
  ) then
    create policy intakes_authenticated_select on public.intakes
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'intakes' and policyname = 'intakes_authenticated_insert'
  ) then
    create policy intakes_authenticated_insert on public.intakes
      for insert to authenticated with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'intakes' and policyname = 'intakes_authenticated_update'
  ) then
    create policy intakes_authenticated_update on public.intakes
      for update to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'print_jobs' and policyname = 'print_jobs_authenticated_select'
  ) then
    create policy print_jobs_authenticated_select on public.print_jobs
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'print_jobs' and policyname = 'print_jobs_authenticated_insert'
  ) then
    create policy print_jobs_authenticated_insert on public.print_jobs
      for insert to authenticated with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'print_jobs' and policyname = 'print_jobs_authenticated_update'
  ) then
    create policy print_jobs_authenticated_update on public.print_jobs
      for update to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'audit_events' and policyname = 'audit_events_authenticated_select'
  ) then
    create policy audit_events_authenticated_select on public.audit_events
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'audit_events' and policyname = 'audit_events_authenticated_insert'
  ) then
    create policy audit_events_authenticated_insert on public.audit_events
      for insert to authenticated with check (true);
  end if;
end
$$;

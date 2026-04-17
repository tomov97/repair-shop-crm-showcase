-- Add intake_type to support sales intakes alongside service intakes.
-- Sales intakes use the prefix PK- (from Bulgarian "Продажба").
-- Service intakes (existing) keep the SC- prefix.

-- 1. Add intake_type column; all existing rows get 'service' by default.
alter table public.intakes
  add column intake_type text not null default 'service';

alter table public.intakes
  add constraint intakes_type_check check (intake_type in ('service', 'sale'));

-- 2. Allow empty issue_description for sales intakes (note is optional).
--    The NOT NULL constraint stays; sales intakes store '' when no note is given.
alter table public.intakes
  alter column issue_description set default '';

-- 3. Separate monotonic sequence for sales intake numbers.
--    NOTE: adjust `start with` to (last_number + 1) before running against production.
create sequence if not exists public.sales_intake_number_seq
  as bigint
  start with 1
  increment by 1
  minvalue 1
  maxvalue 999999
  no cycle;

-- 4. RPC wrapper for generating a sales intake number (PK-DD/MM/YY-NNNNNN).
create or replace function public.next_sales_intake_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  seq_value bigint;
  local_now timestamptz;
begin
  seq_value := nextval('public.sales_intake_number_seq');
  local_now := timezone('Europe/Sofia', now());
  return 'PK-'
    || to_char(local_now, 'DD/MM/YY')
    || '-'
    || lpad(seq_value::text, 6, '0');
end;
$$;

revoke all on function public.next_sales_intake_number() from public;
grant execute on function public.next_sales_intake_number() to service_role;

-- 5. Index to speed up type-filtered directory queries.
create index if not exists intakes_type_idx
  on public.intakes (intake_type, created_at desc);

-- 6. Rebuild get_intake_directory with intake_type filter parameter.
--    Drops both previous versions (202604110001 and 202604160001).
drop function if exists public.get_intake_directory(integer, boolean, boolean);

create or replace function public.get_intake_directory(
  p_limit integer default 30,
  p_archived_only boolean default false,
  p_include_archived boolean default false,
  p_intake_type text default 'service'
)
returns table (
  id uuid,
  customer_id uuid,
  intake_number text,
  intake_type text,
  brand text,
  model text,
  is_archived boolean,
  charged_amount numeric,
  created_at timestamptz,
  archived_at timestamptz,
  customer_full_name text,
  customer_display_phone text,
  latest_print_status text,
  customer_visit_count bigint
)
language sql
stable
as $$
  with filtered as (
    select i.*
    from public.intakes i
    where
      i.intake_type = p_intake_type
      and case
        when p_archived_only then i.is_archived = true
        when p_include_archived then true
        else i.is_archived = false
      end
    order by
      case when p_include_archived and not p_archived_only then i.is_archived end asc nulls first,
      case when p_archived_only then i.archived_at end desc,
      case when not p_archived_only then i.created_at end desc
    limit p_limit
  ),
  visit_counts as (
    select customer_id, count(*)::bigint as visit_count
    from public.intakes
    where customer_id in (select customer_id from filtered)
    group by customer_id
  )
  select
    f.id,
    f.customer_id,
    f.intake_number,
    f.intake_type,
    f.brand,
    f.model,
    f.is_archived,
    f.charged_amount,
    f.created_at,
    f.archived_at,
    c.full_name as customer_full_name,
    c.display_phone as customer_display_phone,
    (
      select pj.status
      from public.print_jobs pj
      where pj.intake_id = f.id
      order by pj.created_at desc
      limit 1
    ) as latest_print_status,
    coalesce(vc.visit_count, 1) as customer_visit_count
  from filtered f
  left join public.customers c on c.id = f.customer_id
  left join visit_counts vc on vc.customer_id = f.customer_id
  order by
    case when p_include_archived and not p_archived_only then f.is_archived end asc nulls first,
    case when p_archived_only then f.archived_at end desc,
    case when not p_archived_only then f.created_at end desc;
$$;

grant execute on function public.get_intake_directory(integer, boolean, boolean, text) to authenticated, service_role;

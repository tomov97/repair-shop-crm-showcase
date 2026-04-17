-- Harden the intake_type discriminator: move guarantees from app code into the DB.
--
-- Background: migration 202604162001 introduced intake_type ('service' | 'sale')
-- and worked around the issue_description NOT NULL constraint by setting a
-- default of ''. It also let app code be the only thing preventing a sale from
-- being archived, and gave get_intake_directory a silent default for the type
-- parameter. This migration tightens all three:
--
--   1. issue_description becomes nullable; service intakes still require a
--      non-empty value via a partial check constraint.
--   2. Sales rows can never be archived (DB-enforced).
--   3. get_intake_directory loses its silent p_intake_type default — callers
--      must declare the type they want.

-- 1a. Backfill any existing sales rows that currently store '' so they become
--     null after we drop NOT NULL. (Service rows keep their non-empty values.)
update public.intakes
set issue_description = null
where intake_type = 'sale'
  and (issue_description is null or length(trim(issue_description)) = 0);

-- 1b. Drop the NOT NULL and the empty-string default introduced in
--     202604162001. The schema now honestly describes the truth: sales
--     don't need an issue_description.
alter table public.intakes alter column issue_description drop not null;
alter table public.intakes alter column issue_description drop default;

-- 1c. Service intakes still require a non-empty issue_description. Sales
--     intakes are unconstrained (null or anything else is fine).
alter table public.intakes
  add constraint intakes_service_requires_issue
  check (
    intake_type <> 'service'
    or (issue_description is not null and length(trim(issue_description)) > 0)
  );

-- 2. Sales intakes can never be archived. Even a buggy update or manual SQL
--    cannot flip a sale into the archive.
alter table public.intakes
  add constraint intakes_sales_never_archived
  check (
    intake_type <> 'sale'
    or (is_archived = false and archived_at is null)
  );

-- 3. Drop the silent p_intake_type default on get_intake_directory.
--    Callers must pass the type explicitly so "forgot to filter" never
--    silently returns service-only data.
drop function if exists public.get_intake_directory(integer, boolean, boolean, text);

create or replace function public.get_intake_directory(
  p_limit integer,
  p_archived_only boolean,
  p_include_archived boolean,
  p_intake_type text
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

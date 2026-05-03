-- Add p_offset parameter and total_count return column to get_intake_directory.
-- This enables server-side pagination on the listing pages (50 per page).

drop function if exists public.get_intake_directory(integer, boolean, boolean, text);

create or replace function public.get_intake_directory(
  p_limit integer,
  p_offset integer,
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
  customer_visit_count bigint,
  total_count bigint
)
language sql
stable
as $$
  with totals as (
    select count(*)::bigint as n
    from public.intakes i
    where
      i.intake_type = p_intake_type
      and case
        when p_archived_only then i.is_archived = true
        when p_include_archived then true
        else i.is_archived = false
      end
  ),
  filtered as (
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
    limit p_limit offset p_offset
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
    coalesce(vc.visit_count, 1) as customer_visit_count,
    (select n from totals) as total_count
  from filtered f
  left join public.customers c on c.id = f.customer_id
  left join visit_counts vc on vc.customer_id = f.customer_id
  order by
    case when p_include_archived and not p_archived_only then f.is_archived end asc nulls first,
    case when p_archived_only then f.archived_at end desc,
    case when not p_archived_only then f.created_at end desc;
$$;

grant execute on function public.get_intake_directory(integer, integer, boolean, boolean, text) to authenticated, service_role;

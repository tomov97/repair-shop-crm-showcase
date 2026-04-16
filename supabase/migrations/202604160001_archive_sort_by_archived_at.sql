drop function if exists public.get_intake_directory(integer, boolean, boolean);

create or replace function public.get_intake_directory(
  p_limit integer default 30,
  p_archived_only boolean default false,
  p_include_archived boolean default false
)
returns table (
  id uuid,
  customer_id uuid,
  intake_number text,
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
      case
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

grant execute on function public.get_intake_directory(integer, boolean, boolean) to authenticated, service_role;

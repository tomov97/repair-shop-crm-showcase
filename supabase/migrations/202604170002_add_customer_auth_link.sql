-- Optional auth link for customers, in preparation for the future client-facing
-- portal. Most customers will never have an account; staff-created records leave
-- this null. When a customer claims their machine via the portal, this column
-- gets set to their Supabase auth user id.
--
-- This migration only adds the column and an index. RLS policies still grant
-- broad access to authenticated users (current internal-only behavior). When
-- the portal is built, RLS will be tightened to use this column for per-customer
-- visibility.

alter table public.customers
  add column if not exists auth_user_id uuid references auth.users(id);

create unique index if not exists customers_auth_user_id_idx
  on public.customers (auth_user_id)
  where auth_user_id is not null;

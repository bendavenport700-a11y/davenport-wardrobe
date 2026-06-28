-- 021_atomic_rental_decrement.sql
-- Atomic decrement for profile rental counters.
-- Using a SQL function avoids the stale read-then-write race present in edge functions
-- that call this (request-return, process-buyout, admin-charge-nonreturn, cancel-rental,
-- admin-refund-order).
-- p_count defaults to 1 for single-rental operations; admin-refund-order passes N for bulk.

create or replace function public.decrement_rental_counters(
  p_user_id   uuid,
  p_fee_cents integer,
  p_count     integer default 1
) returns void language sql as $$
  update public.profiles
  set
    active_rental_count = greatest(0, active_rental_count - p_count),
    monthly_total       = greatest(0, monthly_total - p_fee_cents)
  where id = p_user_id;
$$;

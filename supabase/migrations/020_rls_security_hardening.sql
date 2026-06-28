-- 020_rls_security_hardening.sql
-- Add missing UPDATE/DELETE RLS policies and protect privileged profile columns.
-- All edge functions use supabaseAdmin (service_role) which bypasses RLS, so
-- these restrictions only affect direct client-side calls with a user JWT.

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES — trigger to block clients from writing privileged columns
--    auth.uid() is non-null for authenticated user requests; null for service_role
--    (service_role has no user JWT, so auth.uid() returns null → trigger skips check)
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.prevent_profile_privileged_update()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null then
    if new.is_admin is distinct from old.is_admin then
      raise exception 'Cannot modify is_admin via client';
    end if;
    if new.stripe_customer_id is distinct from old.stripe_customer_id then
      raise exception 'Cannot modify stripe_customer_id via client';
    end if;
    if new.stripe_payment_method_id is distinct from old.stripe_payment_method_id then
      raise exception 'Cannot modify stripe_payment_method_id via client';
    end if;
    if new.deposit_payment_intent_id is distinct from old.deposit_payment_intent_id then
      raise exception 'Cannot modify deposit_payment_intent_id via client';
    end if;
    if new.deposit_status is distinct from old.deposit_status then
      raise exception 'Cannot modify deposit_status via client';
    end if;
    if new.deposit_amount is distinct from old.deposit_amount then
      raise exception 'Cannot modify deposit_amount via client';
    end if;
    if new.active_rental_count is distinct from old.active_rental_count then
      raise exception 'Cannot modify active_rental_count via client';
    end if;
    if new.monthly_total is distinct from old.monthly_total then
      raise exception 'Cannot modify monthly_total via client';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_privileged_update_check
  before update on public.profiles
  for each row execute function public.prevent_profile_privileged_update();

-- Prevent authenticated users from deleting their own profile row directly.
-- Account deletion must go through the delete-account edge function which
-- handles Stripe cleanup, data anonymization, and auth.users deletion.
create policy "profiles_no_direct_delete" on public.profiles
  as restrictive for delete to authenticated using (false);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. REVIEWS — add UPDATE/DELETE for own reviews (previously missing, allowing
--    any authenticated user to modify or delete any other user's review)
-- ──────────────────────────────────────────────────────────────────────────────
create policy "reviews_update_own" on public.reviews
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "reviews_delete_own" on public.reviews
  for delete to authenticated
  using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. RENTALS — block all client-side UPDATE/DELETE.
--    Rental state is only mutated by edge functions via service_role (bypasses RLS).
--    create_order_atomic RPC is security definer and also bypasses RLS.
-- ──────────────────────────────────────────────────────────────────────────────
create policy "rentals_no_client_update" on public.rentals
  as restrictive for update to authenticated using (false);

create policy "rentals_no_client_delete" on public.rentals
  as restrictive for delete to authenticated using (false);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. ORDERS — block all client-side UPDATE/DELETE.
--    Orders are created and updated only by edge functions and stripe-webhook.
-- ──────────────────────────────────────────────────────────────────────────────
create policy "orders_no_client_update" on public.orders
  as restrictive for update to authenticated using (false);

create policy "orders_no_client_delete" on public.orders
  as restrictive for delete to authenticated using (false);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. BILLING_EVENTS — immutable audit log.
--    Records are inserted by edge functions only; clients must never modify them.
-- ──────────────────────────────────────────────────────────────────────────────
create policy "billing_events_immutable_update" on public.billing_events
  as restrictive for update to authenticated using (false);

create policy "billing_events_immutable_delete" on public.billing_events
  as restrictive for delete to authenticated using (false);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. EMAIL_LOG — immutable audit log.
-- ──────────────────────────────────────────────────────────────────────────────
create policy "email_log_immutable_update" on public.email_log
  as restrictive for update to authenticated using (false);

create policy "email_log_immutable_delete" on public.email_log
  as restrictive for delete to authenticated using (false);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. MISSING PERFORMANCE INDEXES
-- ──────────────────────────────────────────────────────────────────────────────
create index if not exists reviews_piece_id_idx
  on public.reviews (piece_id);

create index if not exists reviews_user_id_idx
  on public.reviews (user_id);

-- Composite index for inventory lookup during checkout (piece + availability + size)
create index if not exists piece_units_availability_idx
  on public.piece_units (piece_id, size, is_available);

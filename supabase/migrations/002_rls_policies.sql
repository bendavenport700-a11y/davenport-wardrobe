alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

alter table public.wardrobes enable row level security;
create policy "wardrobes_public_read" on public.wardrobes for select using (is_active = true);

alter table public.pieces enable row level security;
create policy "pieces_public_read" on public.pieces for select using (is_draft = false);

alter table public.rentals enable row level security;
create policy "rentals_select_own" on public.rentals for select using (auth.uid() = user_id);
-- NOTE: No INSERT policy on rentals. Rentals are ONLY created via create_order_atomic RPC
-- (security definer — bypasses RLS). Direct client inserts are intentionally blocked.
-- This prevents fraudulent rental creation via the JS client.

alter table public.orders enable row level security;
create policy "orders_select_own" on public.orders for select using (auth.uid() = user_id);
-- NOTE: No INSERT policy on orders. Orders are ONLY created by:
--   (a) create_order_atomic RPC (security definer — bypasses RLS) for native checkout
--   (b) stripe-webhook Edge Function (service role — bypasses RLS) for web checkout
-- Direct client inserts are intentionally blocked.

alter table public.billing_events enable row level security;
create policy "billing_events_select_own" on public.billing_events for select using (auth.uid() = user_id);

alter table public.suitcase_items enable row level security;
create policy "suitcase_items_all_own" on public.suitcase_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

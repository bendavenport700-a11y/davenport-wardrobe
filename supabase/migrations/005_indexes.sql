-- 005_indexes.sql
-- Performance indexes. Run after 004_checkout_rpc.sql.

-- pieces: most common lookup patterns
create index if not exists pieces_is_available_idx      on public.pieces (is_available) where is_draft = false;
create index if not exists pieces_is_featured_idx       on public.pieces (is_featured)  where is_draft = false;
create index if not exists pieces_category_idx          on public.pieces (category)     where is_draft = false;
create index if not exists pieces_wardrobe_id_idx       on public.pieces (wardrobe_id)  where is_draft = false;
create index if not exists pieces_rental_fee_idx        on public.pieces (rental_fee)   where is_draft = false;
create index if not exists pieces_created_at_idx        on public.pieces (created_at desc);

-- rentals: billing cron and user dashboard
create index if not exists rentals_user_id_idx          on public.rentals (user_id);
create index if not exists rentals_billing_active_idx   on public.rentals (billing_active) where billing_active = true;
create index if not exists rentals_next_billing_idx     on public.rentals (next_billing_date) where billing_active = true;
create index if not exists rentals_piece_id_idx         on public.rentals (piece_id);
create index if not exists rentals_status_idx           on public.rentals (status);

-- orders: user history and admin view
create index if not exists orders_user_id_idx           on public.orders (user_id);
create index if not exists orders_status_idx            on public.orders (status);
create index if not exists orders_created_at_idx        on public.orders (created_at desc);

-- billing_events: audit queries
create index if not exists billing_events_user_id_idx   on public.billing_events (user_id);
create index if not exists billing_events_rental_id_idx on public.billing_events (rental_id);
create index if not exists billing_events_created_at_idx on public.billing_events (created_at desc);

-- suitcase_items: fast per-user cart reads
create index if not exists suitcase_items_user_id_idx   on public.suitcase_items (user_id);

-- Color and composite indexes for FilterBar (Section 41.7)
create index if not exists pieces_color_idx         on public.pieces (color) where is_draft = false;
create index if not exists pieces_browse_idx        on public.pieces (is_available, category, color) where is_draft = false;

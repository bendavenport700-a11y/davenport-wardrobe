-- 009_realtime_and_seed.sql
-- Enable Realtime on tables the client subscribes to, and seed initial wardrobe data.
-- Security: tighten create_order_atomic grant, clean up duplicate index.

-- Security fix: only the Edge Function (service role) may call create_order_atomic
revoke execute on function public.create_order_atomic from authenticated;
grant  execute on function public.create_order_atomic to service_role;

-- Index cleanup: drop duplicate wardrobe index created by 005_indexes.sql
drop index if exists pieces_wardrobe_id_idx;

-- Realtime: orders (confirmation screen polls for status changes)
--           rentals (order detail screen polls per-rental status)
-- Wrapped in DO blocks so repeated runs don't error if already added.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rentals'
  ) then
    alter publication supabase_realtime add table public.rentals;
  end if;
end $$;

-- Seed: The Essentials wardrobe
insert into public.wardrobes (name, description, slug, tags, sort_order)
values (
  'The Essentials',
  'Versatile everyday pieces that work across every occasion — from the office to the weekend.',
  'the-essentials',
  array['everyday', 'versatile', 'professional', 'casual'],
  1
)
on conflict (slug) do nothing;

-- Seed: The Interview Wardrobe
insert into public.wardrobes (name, description, slug, tags, sort_order)
values (
  'The Interview Wardrobe',
  'Sharp, polished pieces built for first impressions — interviews, career fairs, client meetings.',
  'the-interview-wardrobe',
  array['professional', 'interview', 'business', 'formal'],
  2
)
on conflict (slug) do nothing;

-- In-app announcement banners managed from the admin panel.
-- Created directly on the live DB; this migration records the canonical schema.

create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  icon       text not null default 'megaphone',
  active     boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "announcements_public_read" on public.announcements
  for select using (true);

create index if not exists announcements_sort_order_idx on public.announcements (sort_order);

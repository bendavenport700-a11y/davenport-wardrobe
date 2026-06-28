-- Trip planning feature — lets users build packing lists from rentable pieces.
-- Gated behind the trips_enabled feature flag in app_settings.
-- Created directly on the live DB; this migration records the canonical schema.

create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('event', 'vacation', 'extended_stay', 'season')),
  start_date  text,
  end_date    text,
  destination text,
  climate     text check (climate in ('tropical', 'cold', 'mild', 'variable')),
  occasions   text[],
  notes       text,
  status      text not null default 'planning'
              check (status in ('planning', 'active', 'ordered', 'complete')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.trip_items (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  piece_id   uuid not null references public.pieces(id) on delete cascade,
  size       text,
  occasion   text,
  notes      text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.trips      enable row level security;
alter table public.trip_items enable row level security;

create policy "trips_own" on public.trips
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "trip_items_own" on public.trip_items
  using (auth.uid() = (select user_id from public.trips where id = trip_id));

create index if not exists trips_user_id_idx      on public.trips (user_id);
create index if not exists trip_items_trip_id_idx on public.trip_items (trip_id);

create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  piece_id   uuid not null references public.pieces(id) on delete cascade,
  rental_id  uuid not null references public.rentals(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz default now(),
  unique (rental_id)
);

alter table public.reviews enable row level security;

create policy "reviews_public_read" on public.reviews
  for select using (true);

create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id);

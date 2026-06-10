-- saved_wardrobes: lets users bookmark wardrobes to their home screen.
-- Referenced by useSavedWardrobes hook but never migrated — feature was silently broken.

create table public.saved_wardrobes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  wardrobe_id uuid references public.wardrobes(id) on delete cascade not null,
  created_at  timestamptz not null default now(),
  unique(user_id, wardrobe_id)
);

alter table public.saved_wardrobes enable row level security;

-- Users can only read, write, and delete their own saved wardrobes
create policy "saved_wardrobes_own" on public.saved_wardrobes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Index for fast lookup by user
create index saved_wardrobes_user_id_idx on public.saved_wardrobes (user_id);

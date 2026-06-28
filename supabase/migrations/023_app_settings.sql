-- Feature-flag table used by admin settings page and useAppSettings hooks.
-- Created directly on the live DB; this migration records the canonical schema.

create table if not exists public.app_settings (
  key        text primary key,
  value      boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "app_settings_public_read" on public.app_settings
  for select using (true);

-- Seed defaults (if not already present)
insert into public.app_settings (key, value)
values
  ('womens_enabled', false),
  ('trips_enabled',  false)
on conflict (key) do nothing;

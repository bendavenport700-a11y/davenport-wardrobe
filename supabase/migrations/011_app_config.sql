-- Remote config table for things like force-update thresholds.
-- Add a row here to force all older builds to update.

create table public.app_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Public read — app fetches this without auth on launch
alter table public.app_config enable row level security;
create policy "app_config_public_read" on public.app_config for select using (true);

-- Seed: minimum iOS build that can run the app (update this whenever you need to force an upgrade)
insert into public.app_config (key, value) values ('minimum_ios_build', '4');

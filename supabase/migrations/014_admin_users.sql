create table if not exists public.admin_users (
  id           uuid primary key default gen_random_uuid(),
  username     text unique not null,
  password     text not null,
  display_name text not null,
  role         text not null default 'catalog' check (role in ('admin', 'catalog')),
  created_at   timestamptz default now()
);

-- Lock down with RLS — only service role key (used by admin) can access
alter table public.admin_users enable row level security;

create policy "deny_public" on public.admin_users
  as restrictive for all to public using (false);

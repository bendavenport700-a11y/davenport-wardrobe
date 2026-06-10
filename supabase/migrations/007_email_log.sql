-- 007_email_log.sql
create table public.email_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  to_email    text not null,
  subject     text not null,
  type        text not null check (type in (
                  'order_confirmed','billing_receipt','payment_failed',
                  'return_instructions','buyout_confirmed','deposit_released'
                )),
  status      text not null default 'pending' check (status in ('pending','sent','failed')),
  resend_id   text,           -- Resend's message ID for debugging
  error       text,
  created_at  timestamptz not null default now()
);

-- RLS: users can read their own email log; admin reads all via service role
alter table public.email_log enable row level security;
create policy "email_log_select_own" on public.email_log
  for select using (auth.uid() = user_id);

create index if not exists email_log_user_id_idx on public.email_log (user_id);
create index if not exists email_log_status_idx  on public.email_log (status) where status = 'failed';

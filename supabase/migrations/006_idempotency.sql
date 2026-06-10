-- 006_idempotency.sql
-- Prevents duplicate order creation from webhook retries.

-- Unique constraint on payment intent: one order per charge
alter table public.orders
  add constraint orders_payment_intent_unique
  unique (stripe_payment_intent_id);

-- Add checkout_session_id column for web checkout idempotency
alter table public.orders
  add column if not exists checkout_session_id text;

create unique index if not exists orders_checkout_session_unique
  on public.orders (checkout_session_id)
  where checkout_session_id is not null;

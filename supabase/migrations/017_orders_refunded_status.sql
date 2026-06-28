-- 017_orders_refunded_status.sql
-- Add 'refunded' to the orders.status CHECK constraint.
-- Without this, admin-refund-order throws a DB error even after Stripe
-- successfully refunds the customer.

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
    check (status in ('pending','confirmed','sourcing','shipped','delivered','complete','refunded'));

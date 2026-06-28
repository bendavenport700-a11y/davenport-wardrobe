-- 019_orders_refund_requested_status.sql
-- Add 'refund_requested' to orders.status so customer-initiated refund requests
-- are visible in the admin panel as a distinct state.

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
    check (status in (
      'pending','confirmed','sourcing','shipped','delivered',
      'complete','refunded','refund_requested'
    ));

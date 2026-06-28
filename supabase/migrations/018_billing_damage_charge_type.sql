-- 018_billing_damage_charge_type.sql
-- Add 'damage_charge' to billing_events.type so excess damage charges
-- (amounts above the $75 deposit) can be logged distinctly from deposit captures.

alter table public.billing_events
  drop constraint if exists billing_events_type_check;

alter table public.billing_events
  add constraint billing_events_type_check
    check (type in (
      'first_month','recurring','buyout','deposit_hold',
      'deposit_release','deposit_capture','refund','damage_charge'
    ));

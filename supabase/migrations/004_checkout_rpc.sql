-- 004_checkout_rpc.sql
-- Atomic order creation: inventory lock + rentals + order + billing event in one transaction.
-- Either all inserts succeed or none do.

create or replace function public.create_order_atomic(
  p_user_id                  uuid,
  p_order_id                 uuid,
  p_items                    jsonb,          -- [{piece_id, size, rental_fee_cents, wear_count_at_rental, buyout_price_snapshot}]
  p_payment_intent_id        text,
  p_deposit_intent_id        text,
  p_has_deposit_on_file      boolean,
  p_shipping_address         jsonb,
  p_discounted_monthly_cents integer default 0,   -- actual amount charged for first month (after discount)
  p_checkout_session_id      text    default null,
  p_handling_fee_cents       integer default 0,
  p_deposit_amount_cents     integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rental_ids       uuid[]  := '{}';
  v_rental_id        uuid;
  v_raw_monthly      integer := 0;  -- sum of undiscounted rental_fee_cents (for reference)
  v_deposit_amount   integer;
  v_item             jsonb;
  v_next_billing     date    := (date_trunc('month', now()) + interval '1 month')::date;
  v_is_available     boolean;
begin
  -- Sum raw monthly total from items (undiscounted — stored only for audit reference)
  select coalesce(sum((item->>'rental_fee_cents')::integer), 0)
  into v_raw_monthly
  from jsonb_array_elements(p_items) as item;

  v_deposit_amount := case when p_has_deposit_on_file then 0 else p_deposit_amount_cents end;

  -- Process each item: lock → validate → mark unavailable → insert rental
  for v_item in select * from jsonb_array_elements(p_items) loop

    -- Pessimistic lock: prevents double-booking under concurrent checkouts
    select is_available into v_is_available
    from public.pieces
    where id = (v_item->>'piece_id')::uuid
    for update;

    if not found then
      raise exception 'PIECE_NOT_FOUND:%', (v_item->>'piece_id')
        using errcode = 'P0001';
    end if;

    if not v_is_available then
      raise exception 'PIECE_UNAVAILABLE:%', (v_item->>'piece_id')
        using errcode = 'P0001';
    end if;

    -- Validate the requested size is actually offered on this piece
    if not exists (
      select 1 from public.pieces
      where id = (v_item->>'piece_id')::uuid
        and (v_item->>'size') = any(sizes_available)
    ) then
      raise exception 'SIZE_UNAVAILABLE:%:%', (v_item->>'piece_id'), (v_item->>'size')
        using errcode = 'P0001';
    end if;

    update public.pieces
    set is_available = false
    where id = (v_item->>'piece_id')::uuid;

    insert into public.rentals (
      user_id, piece_id, size, status,
      rental_fee_cents, wear_count_at_rental, buyout_price_snapshot,
      billing_active, last_billed_at, next_billing_date, min_rental_days
    ) values (
      p_user_id,
      (v_item->>'piece_id')::uuid,
      v_item->>'size',
      'pending',
      (v_item->>'rental_fee_cents')::integer,
      (v_item->>'wear_count_at_rental')::integer,
      (v_item->>'buyout_price_snapshot')::integer,
      true, now(), v_next_billing, 30
    )
    returning id into v_rental_id;

    v_rental_ids := v_rental_ids || v_rental_id;
  end loop;

  -- Create order — use discounted monthly total for all financial columns
  insert into public.orders (
    id, user_id, rental_ids,
    stripe_payment_intent_id, deposit_intent_id,
    first_month_total, handling_fee_cents, deposit_amount, total_charged,
    shipping_address, status, checkout_session_id
  ) values (
    p_order_id, p_user_id, v_rental_ids,
    p_payment_intent_id, p_deposit_intent_id,
    p_discounted_monthly_cents,
    p_handling_fee_cents,
    v_deposit_amount,
    p_discounted_monthly_cents + p_handling_fee_cents + v_deposit_amount,
    p_shipping_address, 'confirmed', p_checkout_session_id
  );

  -- Update profile counters with discounted monthly amount
  update public.profiles
  set
    active_rental_count = active_rental_count + jsonb_array_length(p_items),
    monthly_total       = monthly_total + p_discounted_monthly_cents
  where id = p_user_id;

  -- Log billing event with actual charge amount
  insert into public.billing_events (
    user_id, type, amount_cents, stripe_payment_intent_id, status, description
  ) values (
    p_user_id,
    'first_month',
    p_discounted_monthly_cents + p_handling_fee_cents,
    p_payment_intent_id,
    'succeeded',
    'First month + delivery — ' || jsonb_array_length(p_items)::text || ' piece(s)'
  );

  -- Clear server-side suitcase now that order is placed
  delete from public.suitcase_items where user_id = p_user_id;

  return p_order_id;
end;
$$;

-- Only the Edge Function (service role) may call this — authenticated clients cannot
-- call with an arbitrary p_user_id to create fraudulent orders.
revoke execute on function public.create_order_atomic from public;
revoke execute on function public.create_order_atomic from authenticated;
grant  execute on function public.create_order_atomic to service_role;

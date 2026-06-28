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
  p_checkout_session_id      text    default null,
  p_handling_fee_cents       integer default 0,
  p_deposit_amount_cents     integer default 0,
  p_charged_today_cents      integer default null  -- total Stripe charge (first month + handling); falls back to sum from items
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rental_ids       uuid[]  := '{}';
  v_rental_id        uuid;
  v_unit_id          uuid;
  v_raw_monthly      integer := 0;  -- sum of undiscounted rental_fee_cents (for billing_events log)
  v_deposit_amount   integer;
  v_item             jsonb;
  v_next_billing     date    := (now()::date + 30);  -- rolling 30-day billing cycle
  v_is_available     boolean;
begin
  -- Sum raw monthly total from items (undiscounted — stored only for audit reference)
  select coalesce(sum((item->>'rental_fee_cents')::integer), 0)
  into v_raw_monthly
  from jsonb_array_elements(p_items) as item;

  v_deposit_amount := case when p_has_deposit_on_file then 0 else p_deposit_amount_cents end;

  -- Process each item: lock → validate → pick unit → mark unavailable → insert rental
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

    -- Pick the least-worn available unit of the requested size; fall back to any size if
    -- the exact size is unavailable (shouldn't happen given size validation above).
    v_unit_id := null;

    update public.piece_units
    set is_available = false
    where id = (
      select id from public.piece_units
      where piece_id = (v_item->>'piece_id')::uuid
        and is_available = true
        and size = v_item->>'size'
      order by wear_count asc
      limit 1
    )
    returning id into v_unit_id;

    if v_unit_id is null then
      update public.piece_units
      set is_available = false
      where id = (
        select id from public.piece_units
        where piece_id = (v_item->>'piece_id')::uuid
          and is_available = true
        order by wear_count asc
        limit 1
      )
      returning id into v_unit_id;
    end if;

    -- Mark the piece unavailable at the catalog level
    update public.pieces
    set is_available = false
    where id = (v_item->>'piece_id')::uuid;

    insert into public.rentals (
      user_id, piece_id, piece_unit_id, size, status,
      rental_fee_cents, wear_count_at_rental, buyout_price_snapshot,
      billing_active, last_billed_at, next_billing_date, min_rental_days
    ) values (
      p_user_id,
      (v_item->>'piece_id')::uuid,
      v_unit_id,
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

  -- Create order — 'confirmed' because payment was already taken before calling this RPC
  insert into public.orders (
    id, user_id, rental_ids,
    stripe_payment_intent_id, deposit_intent_id,
    first_month_total, handling_fee_cents, deposit_amount, total_charged,
    shipping_address, status, checkout_session_id
  ) values (
    p_order_id, p_user_id, v_rental_ids,
    p_payment_intent_id, p_deposit_intent_id,
    v_raw_monthly, p_handling_fee_cents, v_deposit_amount,
    coalesce(p_charged_today_cents, v_raw_monthly + p_handling_fee_cents + v_deposit_amount),
    p_shipping_address, 'confirmed', p_checkout_session_id
  );

  update public.profiles
  set
    active_rental_count = coalesce(active_rental_count, 0) + array_length(v_rental_ids, 1),
    monthly_total       = coalesce(monthly_total, 0) + v_raw_monthly
  where id = p_user_id;

  insert into public.billing_events (
    user_id, type, amount_cents, stripe_payment_intent_id, status, description
  ) values (
    p_user_id,
    'first_month',
    coalesce(p_charged_today_cents, v_raw_monthly + p_handling_fee_cents + v_deposit_amount),
    p_payment_intent_id,
    'succeeded',
    'First month + handling — ' || jsonb_array_length(p_items)::text || ' piece(s)'
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

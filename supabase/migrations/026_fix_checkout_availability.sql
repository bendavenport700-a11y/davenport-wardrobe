-- 026_fix_checkout_availability.sql
-- Bug fix: create_order_atomic was setting pieces.is_available = false unconditionally
-- when any unit was rented. For pieces with multiple units (different sizes), this hid
-- remaining available sizes from the catalog immediately after checkout.
-- Fix: recompute is_available and sizes_available from the actual remaining available units.

create or replace function public.create_order_atomic(
  p_user_id                  uuid,
  p_order_id                 uuid,
  p_items                    jsonb,
  p_payment_intent_id        text,
  p_deposit_intent_id        text,
  p_has_deposit_on_file      boolean,
  p_shipping_address         jsonb,
  p_checkout_session_id      text    default null,
  p_handling_fee_cents       integer default 0,
  p_deposit_amount_cents     integer default 0,
  p_charged_today_cents      integer default null
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
  v_raw_monthly      integer := 0;
  v_deposit_amount   integer;
  v_item             jsonb;
  v_next_billing     date    := (now()::date + 30);
  v_is_available     boolean;
  v_avail_sizes      text[];
begin
  select coalesce(sum((item->>'rental_fee_cents')::integer), 0)
  into v_raw_monthly
  from jsonb_array_elements(p_items) as item;

  v_deposit_amount := case when p_has_deposit_on_file then 0 else p_deposit_amount_cents end;

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

    if not exists (
      select 1 from public.pieces
      where id = (v_item->>'piece_id')::uuid
        and (v_item->>'size') = any(sizes_available)
    ) then
      raise exception 'SIZE_UNAVAILABLE:%:%', (v_item->>'piece_id'), (v_item->>'size')
        using errcode = 'P0001';
    end if;

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

    -- Recompute availability from remaining available units (fixes multi-unit pieces
    -- where only one size was rented — other sizes should remain visible in the catalog).
    select
      coalesce(array_agg(distinct size order by size), '{}')
    into v_avail_sizes
    from public.piece_units
    where piece_id = (v_item->>'piece_id')::uuid
      and is_available = true;

    update public.pieces
    set
      is_available    = (array_length(v_avail_sizes, 1) > 0),
      sizes_available = v_avail_sizes
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

  delete from public.suitcase_items where user_id = p_user_id;

  return p_order_id;
end;
$$;

revoke execute on function public.create_order_atomic from public;
revoke execute on function public.create_order_atomic from authenticated;
grant  execute on function public.create_order_atomic to service_role;

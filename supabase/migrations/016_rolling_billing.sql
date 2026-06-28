-- 016_rolling_billing.sql
-- Switches billing from fixed 1st-of-month to rolling 30-day cycles.
-- Each rental's next_billing_date now advances from its own scheduled date,
-- so a customer who orders on June 15 is billed again on July 15 (not Aug 1).

-- ── 1. Update create_order_atomic ────────────────────────────────────────────
-- Changed: v_next_billing = now() + 30 days (was first of next month)

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id                uuid,
  p_order_id               uuid,
  p_items                  jsonb,
  p_payment_intent_id      text,
  p_deposit_intent_id      text,
  p_has_deposit_on_file    boolean,
  p_shipping_address       jsonb,
  p_checkout_session_id    text    DEFAULT NULL::text,
  p_handling_fee_cents     integer DEFAULT 0,
  p_deposit_amount_cents   integer DEFAULT 0,
  p_charged_today_cents    integer DEFAULT NULL::integer
) RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
declare
  v_rental_ids       uuid[]  := '{}';
  v_rental_id        uuid;
  v_unit_id          uuid;
  v_monthly_total    integer := 0;
  v_deposit_amount   integer;
  v_item             jsonb;
  v_piece_id         uuid;
  v_size             text;
  v_avail_sizes      text[];
  v_next_billing     date := (now() + interval '30 days')::date;
begin
  -- Items already carry discounted rental_fee_cents from the edge function
  select coalesce(sum((item->>'rental_fee_cents')::integer), 0)
  into v_monthly_total
  from jsonb_array_elements(p_items) as item;

  v_deposit_amount := case when p_has_deposit_on_file then 0 else p_deposit_amount_cents end;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_piece_id := (v_item->>'piece_id')::uuid;
    v_size     := v_item->>'size';

    -- Claim the least-worn available unit for this size (SKIP LOCKED = no deadlock)
    select id into v_unit_id
    from public.piece_units
    where piece_id    = v_piece_id
      and size        = v_size
      and is_available = true
    order by wear_count asc, created_at asc
    limit 1
    for update skip locked;

    if v_unit_id is null then
      raise exception 'SIZE_UNAVAILABLE:%:%', v_piece_id, v_size
        using errcode = 'P0001';
    end if;

    -- Lock the unit
    update public.piece_units set is_available = false where id = v_unit_id;

    -- Create rental tied to this unit
    insert into public.rentals (
      user_id, piece_id, piece_unit_id, size, status,
      rental_fee_cents, wear_count_at_rental, buyout_price_snapshot,
      billing_active, last_billed_at, next_billing_date, min_rental_days
    ) values (
      p_user_id, v_piece_id, v_unit_id, v_size, 'pending',
      (v_item->>'rental_fee_cents')::integer,
      (v_item->>'wear_count_at_rental')::integer,
      (v_item->>'buyout_price_snapshot')::integer,
      true, now(), v_next_billing, 30
    )
    returning id into v_rental_id;

    v_rental_ids := v_rental_ids || v_rental_id;

    -- Keep pieces.sizes_available and is_available in sync
    select array_agg(distinct size order by size)
    into v_avail_sizes
    from public.piece_units
    where piece_id = v_piece_id and is_available = true;

    update public.pieces
    set
      sizes_available = coalesce(v_avail_sizes, '{}'),
      is_available    = (v_avail_sizes is not null)
    where id = v_piece_id;

  end loop;

  -- Create the order record
  insert into public.orders (
    id, user_id, rental_ids,
    stripe_payment_intent_id, deposit_intent_id,
    first_month_total, handling_fee_cents, deposit_amount, total_charged,
    shipping_address, status, checkout_session_id
  ) values (
    p_order_id, p_user_id, v_rental_ids,
    p_payment_intent_id, p_deposit_intent_id,
    v_monthly_total, p_handling_fee_cents, v_deposit_amount,
    coalesce(p_charged_today_cents, v_monthly_total + p_handling_fee_cents + v_deposit_amount),
    p_shipping_address, 'confirmed', p_checkout_session_id
  );

  update public.profiles
  set
    active_rental_count = active_rental_count + jsonb_array_length(p_items),
    monthly_total       = monthly_total + v_monthly_total
  where id = p_user_id;

  insert into public.billing_events (
    user_id, type, amount_cents, stripe_payment_intent_id, status, description
  ) values (
    p_user_id, 'first_month',
    coalesce(p_charged_today_cents, v_monthly_total + p_handling_fee_cents),
    p_payment_intent_id, 'succeeded',
    'First month + delivery — ' || jsonb_array_length(p_items)::text || ' piece(s)'
  );

  delete from public.suitcase_items where user_id = p_user_id;

  return p_order_id;
end;
$$;

-- ── 2. Switch cron from 1st-of-month to daily ────────────────────────────────
SELECT cron.alter_job(job_id := (SELECT jobid FROM cron.job WHERE jobname = 'charge-monthly'), schedule := '0 9 * * *');

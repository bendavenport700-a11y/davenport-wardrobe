-- 028_fix_billing_date.sql
-- Migration 027 accidentally changed v_next_billing from "now + 30 days" (rolling cycle)
-- to "first of next month" (calendar cycle). This caused early double-charges for customers
-- who checkout near month-end (e.g., Jan 28 checkout → Feb 1 second charge = 4 days).
-- Restore rolling 30-day billing so the second charge always fires ≥30 days after the first.

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id               uuid,
  p_order_id              uuid,
  p_items                 jsonb,
  p_payment_intent_id     text,
  p_deposit_intent_id     text,
  p_has_deposit_on_file   boolean,
  p_shipping_address      jsonb,
  p_checkout_session_id   text    DEFAULT NULL,
  p_handling_fee_cents    integer DEFAULT 0,
  p_deposit_amount_cents  integer DEFAULT 0,
  p_charged_today_cents   integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rental_ids       uuid[]  := '{}';
  v_rental_id        uuid;
  v_unit_id          uuid;
  v_monthly_total    integer := 0;
  v_deposit_amount   integer;
  v_item             jsonb;
  v_piece_id         uuid;
  v_size             text;
  v_prefer_worn      boolean;
  v_avail_sizes      text[];
  -- Rolling 30-day cycle: second charge fires 30 days after checkout, not on the 1st of the month.
  v_next_billing     date := (now()::date + 30);
BEGIN
  SELECT coalesce(sum((item->>'rental_fee_cents')::integer), 0)
  INTO v_monthly_total
  FROM jsonb_array_elements(p_items) AS item;

  v_deposit_amount := CASE WHEN p_has_deposit_on_file THEN 0 ELSE p_deposit_amount_cents END;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_piece_id    := (v_item->>'piece_id')::uuid;
    v_size        := v_item->>'size';
    v_prefer_worn := coalesce((v_item->>'prefer_worn')::boolean, false);

    -- Try to claim a unit matching the preferred condition
    IF v_prefer_worn THEN
      -- Customer wants a worn unit (lower price)
      SELECT id INTO v_unit_id
      FROM public.piece_units
      WHERE piece_id     = v_piece_id
        AND size         = v_size
        AND is_available = true
        AND wear_count   > 0
      ORDER BY wear_count ASC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
    ELSE
      -- Customer wants a pristine unit (0 wears)
      SELECT id INTO v_unit_id
      FROM public.piece_units
      WHERE piece_id     = v_piece_id
        AND size         = v_size
        AND is_available = true
        AND wear_count   = 0
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
    END IF;

    -- Fallback: if preferred tier is exhausted, take any available unit
    IF v_unit_id IS NULL THEN
      SELECT id INTO v_unit_id
      FROM public.piece_units
      WHERE piece_id     = v_piece_id
        AND size         = v_size
        AND is_available = true
      ORDER BY wear_count ASC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
    END IF;

    IF v_unit_id IS NULL THEN
      RAISE EXCEPTION 'SIZE_UNAVAILABLE:%:%', v_piece_id, v_size
        USING errcode = 'P0001';
    END IF;

    UPDATE public.piece_units SET is_available = false WHERE id = v_unit_id;

    INSERT INTO public.rentals (
      user_id, piece_id, piece_unit_id, size, status,
      rental_fee_cents, wear_count_at_rental, buyout_price_snapshot,
      billing_active, last_billed_at, next_billing_date, min_rental_days
    ) VALUES (
      p_user_id, v_piece_id, v_unit_id, v_size, 'pending',
      (v_item->>'rental_fee_cents')::integer,
      (v_item->>'wear_count_at_rental')::integer,
      (v_item->>'buyout_price_snapshot')::integer,
      true, now(), v_next_billing, 30
    )
    RETURNING id INTO v_rental_id;

    v_rental_ids := v_rental_ids || v_rental_id;

    SELECT array_agg(DISTINCT size ORDER BY size)
    INTO v_avail_sizes
    FROM public.piece_units
    WHERE piece_id = v_piece_id AND is_available = true;

    UPDATE public.pieces
    SET
      sizes_available = coalesce(v_avail_sizes, '{}'),
      is_available    = (v_avail_sizes IS NOT NULL)
    WHERE id = v_piece_id;

  END LOOP;

  INSERT INTO public.orders (
    id, user_id, rental_ids,
    stripe_payment_intent_id, deposit_intent_id,
    first_month_total, handling_fee_cents, deposit_amount, total_charged,
    shipping_address, status, checkout_session_id
  ) VALUES (
    p_order_id, p_user_id, v_rental_ids,
    p_payment_intent_id, p_deposit_intent_id,
    v_monthly_total, p_handling_fee_cents, v_deposit_amount,
    coalesce(p_charged_today_cents, v_monthly_total + p_handling_fee_cents + v_deposit_amount),
    p_shipping_address, 'confirmed', p_checkout_session_id
  );

  UPDATE public.profiles
  SET
    active_rental_count = active_rental_count + jsonb_array_length(p_items),
    monthly_total       = monthly_total + v_monthly_total
  WHERE id = p_user_id;

  INSERT INTO public.billing_events (
    user_id, type, amount_cents, stripe_payment_intent_id, status, description
  ) VALUES (
    p_user_id, 'first_month',
    coalesce(p_charged_today_cents, v_monthly_total + p_handling_fee_cents),
    p_payment_intent_id, 'succeeded',
    'First month + delivery — ' || jsonb_array_length(p_items)::text || ' piece(s)'
  );

  DELETE FROM public.suitcase_items WHERE user_id = p_user_id;

  RETURN p_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order_atomic FROM public;
REVOKE EXECUTE ON FUNCTION public.create_order_atomic FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.create_order_atomic TO service_role;

-- Also fix any existing rentals that got incorrect next_billing_date from 027.
-- If a rental's next_billing_date is within 15 days of created_at, it was likely
-- created near month-end and got the "first of month" bug — push it out to 30 days.
UPDATE public.rentals
SET next_billing_date = (created_at::date + 30)
WHERE billing_active = true
  AND status NOT IN ('returned', 'bought_out', 'return_requested')
  AND (next_billing_date - created_at::date) < 15;

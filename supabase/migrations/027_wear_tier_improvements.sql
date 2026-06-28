-- 027_wear_tier_improvements.sql
--
-- 1. Fix refresh_piece_pricing trigger: auto-update pieces.condition from wear_count
-- 2. Add prefer_worn to suitcase_items for per-unit condition selection at checkout
-- 3. Update create_order_atomic to honor prefer_worn (pick worn vs pristine unit)
-- 4. Auto-tag all pieces with occasion + season based on category and brand

-- ── 1. Fix refresh_piece_pricing to also derive condition from wear_count ────────

CREATE OR REPLACE FUNCTION public.refresh_piece_pricing()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_buyout integer;
  v_rental integer;
BEGIN
  v_buyout := round(new.cost_price::numeric * greatest(0.30, 0.90 - new.wear_count * 0.08));
  v_rental := round(v_buyout::numeric         * greatest(0.05, new.base_rental_rate - new.wear_count * 0.010));
  new.buyout_price := v_buyout;
  new.rental_fee   := v_rental;
  -- Derive condition tier from wear_count so it always stays in sync
  new.condition := CASE
    WHEN new.wear_count = 0  THEN 'new'
    WHEN new.wear_count <= 3 THEN 'like_new'
    ELSE                          'good'
  END;
  IF v_rental < 400 THEN
    new.is_available := false;
    new.retired_at   := coalesce(new.retired_at, now());
  END IF;
  new.updated_at := now();
  RETURN new;
END;
$$;

-- Run the trigger for every existing piece so condition is now in sync
UPDATE public.pieces SET wear_count = wear_count WHERE true;

-- ── 2. Add prefer_worn to suitcase_items ─────────────────────────────────────────

ALTER TABLE public.suitcase_items
  ADD COLUMN IF NOT EXISTS prefer_worn boolean NOT NULL DEFAULT false;

-- ── 3. Update create_order_atomic to honor prefer_worn ──────────────────────────
-- When prefer_worn = true  → pick a unit with wear_count > 0 (cheapest worn unit)
-- When prefer_worn = false → prefer wear_count = 0 (pristine); fallback to any available

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id               uuid,
  p_order_id              uuid,
  p_items                 jsonb,
  p_payment_intent_id     text,
  p_deposit_intent_id     text,
  p_has_deposit_on_file   boolean,
  p_shipping_address      jsonb,
  p_checkout_session_id   text    default null,
  p_handling_fee_cents    integer default 0,
  p_deposit_amount_cents  integer default 0,
  p_charged_today_cents   integer default null
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
  v_next_billing     date := (date_trunc('month', now()) + interval '1 month')::date;
BEGIN
  SELECT coalesce(sum((item->>'rental_fee_cents')::integer), 0)
  INTO v_monthly_total
  FROM jsonb_array_elements(p_items) AS item;

  v_deposit_amount := CASE WHEN p_has_deposit_on_file THEN 0 ELSE p_deposit_amount_cents END;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_piece_id   := (v_item->>'piece_id')::uuid;
    v_size       := v_item->>'size';
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
      -- Customer wants a pristine unit (0 wears, higher price)
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

-- ── 4. Auto-tag pieces with occasion + season ────────────────────────────────────
-- Adds tags based on category and brand. Preserves any custom tags already set.
-- Occasions: Work, Weekend, Casual, Formal, Active, Outdoor
-- Seasons:   Spring, Summer, Fall, Winter

-- Occasion: Work (professional, can be worn to office)
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Work')) ORDER BY 1)
WHERE category IN ('shirt','polo','blazer','trousers','chinos','pants','sweater','cardigan','henley')
  AND NOT (tags @> ARRAY['Work']);

-- Occasion: Formal
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Formal')) ORDER BY 1)
WHERE category IN ('blazer','trousers')
  AND NOT (tags @> ARRAY['Formal']);

-- Occasion: Weekend
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Weekend')) ORDER BY 1)
WHERE category IN ('shirt','polo','sweater','cardigan','henley','hoodie','sweatshirt','denim','pants',
                   'chinos','shorts','outerwear','jacket','coat','bomber','fleece','t-shirt','vest','joggers')
  AND NOT (tags @> ARRAY['Weekend']);

-- Occasion: Casual
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Casual')) ORDER BY 1)
WHERE category IN ('t-shirt','shorts','hoodie','sweatshirt','denim','joggers','vest')
  AND NOT (tags @> ARRAY['Casual']);

-- Occasion: Active (category-based)
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Active')) ORDER BY 1)
WHERE category IN ('t-shirt','shorts','joggers','vest')
  AND NOT (tags @> ARRAY['Active']);

-- Occasion: Active (brand-based — athletic brands)
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Active')) ORDER BY 1)
WHERE (
    brand ILIKE '%lululemon%' OR brand ILIKE '%tracksmith%' OR
    brand ILIKE '%vuori%'     OR brand ILIKE '%nike%'       OR
    brand ILIKE '%adidas%'    OR brand ILIKE '%under armour%' OR
    brand ILIKE '%reigning champ%'
  )
  AND NOT (tags @> ARRAY['Active']);

-- Occasion: Outdoor (category-based)
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Outdoor')) ORDER BY 1)
WHERE category IN ('outerwear','jacket','coat','bomber','fleece')
  AND NOT (tags @> ARRAY['Outdoor']);

-- Occasion: Outdoor (brand-based)
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Outdoor')) ORDER BY 1)
WHERE (
    brand ILIKE '%patagonia%'  OR brand ILIKE '%arc''teryx%' OR
    brand ILIKE '%arcteryx%'   OR brand ILIKE '%north face%' OR
    brand ILIKE '%columbia%'
  )
  AND NOT (tags @> ARRAY['Outdoor']);

-- Season: Fall (warm layers, heavier fabrics)
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Fall')) ORDER BY 1)
WHERE category IN ('sweater','cardigan','hoodie','sweatshirt','outerwear','jacket',
                   'coat','bomber','fleece','vest','denim','chinos','pants','trousers','blazer')
  AND NOT (tags @> ARRAY['Fall']);

-- Season: Winter (heavy outerwear and warmth)
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Winter')) ORDER BY 1)
WHERE category IN ('sweater','cardigan','hoodie','sweatshirt','outerwear','coat','fleece','vest')
  AND NOT (tags @> ARRAY['Winter']);

-- Season: Spring (transitional layers, lighter pieces)
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Spring')) ORDER BY 1)
WHERE category IN ('shirt','polo','t-shirt','shorts','chinos','denim','blazer','jacket','outerwear')
  AND NOT (tags @> ARRAY['Spring']);

-- Season: Summer (lightweight, warm-weather pieces)
UPDATE public.pieces
SET tags = array(SELECT DISTINCT unnest(array_append(tags, 'Summer')) ORDER BY 1)
WHERE category IN ('t-shirt','shorts','polo','shirt')
  AND NOT (tags @> ARRAY['Summer']);

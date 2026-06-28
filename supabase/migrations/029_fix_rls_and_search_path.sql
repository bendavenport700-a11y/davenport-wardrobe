-- 029_fix_rls_and_search_path.sql
--
-- 1. Drop duplicate ALL-action RLS policies on trips/trip_items.
--    Migration 025 created per-action policies using (SELECT auth.uid()) — the correct form.
--    A later migration added trips_own / trip_items_own ALL-action policies using bare auth.uid().
--    Two policies for the same role+action means Postgres evaluates both (permissive OR), which:
--      a) doubles RLS evaluation cost, and
--      b) keeps the bare auth.uid() re-evaluated per row (initplan performance warning).
--    Fix: drop the ALL-action duplicates; the per-action policies remain and are sufficient.
--
-- 2. Add SET search_path = public to refresh_piece_pricing.
--    The function was replaced in migration 027 without the search_path guard,
--    re-introducing the mutable search_path security advisory.

-- ── 1. Drop duplicate ALL-action policies ────────────────────────────────────

DROP POLICY IF EXISTS trips_own      ON public.trips;
DROP POLICY IF EXISTS trip_items_own ON public.trip_items;

-- ── 2. Fix refresh_piece_pricing search_path ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.refresh_piece_pricing()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_buyout integer;
  v_rental integer;
BEGIN
  v_buyout := round(new.cost_price::numeric * greatest(0.30, 0.90 - new.wear_count * 0.08));
  v_rental := round(v_buyout::numeric         * greatest(0.05, new.base_rental_rate - new.wear_count * 0.010));
  new.buyout_price := v_buyout;
  new.rental_fee   := v_rental;
  -- Derive condition tier from wear_count so it stays in sync
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

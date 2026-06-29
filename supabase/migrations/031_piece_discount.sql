-- Admin-controlled sale discount on individual pieces.
-- discount_pct: 0 = no discount, 1-90 = % off the rental fee shown to customers.
-- Buyout price is already wear-count driven and is NOT affected by this field.
ALTER TABLE public.pieces
  ADD COLUMN IF NOT EXISTS discount_pct integer NOT NULL DEFAULT 0
  CHECK (discount_pct >= 0 AND discount_pct <= 90);

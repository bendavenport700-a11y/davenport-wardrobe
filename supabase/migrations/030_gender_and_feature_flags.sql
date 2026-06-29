-- Add gender to pieces (all existing pieces default to 'men')
ALTER TABLE public.pieces
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'men'
  CHECK (gender IN ('men', 'women', 'unisex'));

-- Enable Plans feature on web
UPDATE public.app_settings SET value = 'true'::jsonb WHERE key = 'trips_enabled';

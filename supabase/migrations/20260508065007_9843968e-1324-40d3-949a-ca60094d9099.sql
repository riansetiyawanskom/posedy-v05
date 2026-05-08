ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS margin_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS margin_type text NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS margin_value numeric NOT NULL DEFAULT 0;
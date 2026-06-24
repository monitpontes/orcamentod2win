ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS usd_brl_rate numeric NOT NULL DEFAULT 5.50,
  ADD COLUMN IF NOT EXISTS sensor_count integer NOT NULL DEFAULT 400;

ALTER TABLE public.procurement_items
  ADD COLUMN IF NOT EXISTS original_currency text NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS original_unit_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qty_per_sensor numeric NOT NULL DEFAULT 0;
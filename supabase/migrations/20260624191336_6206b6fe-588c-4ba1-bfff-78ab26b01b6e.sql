
CREATE TABLE public.procurement_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  bridge_key text NOT NULL,
  bridge_name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  component_id text NOT NULL,
  component_name text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  qty numeric NOT NULL DEFAULT 0,
  unit_price_ref numeric NOT NULL DEFAULT 0,
  total_ref numeric NOT NULL DEFAULT 0,
  purchase_status text NOT NULL DEFAULT 'nao',
  amount_paid numeric NOT NULL DEFAULT 0,
  supplier text NOT NULL DEFAULT '',
  purchase_date date,
  delivery_status text NOT NULL DEFAULT 'nao',
  delivery_date date,
  notes text NOT NULL DEFAULT '',
  in_scope boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (budget_id, bridge_key, component_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.procurement_items TO authenticated;
GRANT ALL ON public.procurement_items TO service_role;

ALTER TABLE public.procurement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own procurement items"
  ON public.procurement_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own procurement items"
  ON public.procurement_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own procurement items"
  ON public.procurement_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own procurement items"
  ON public.procurement_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_procurement_items_budget ON public.procurement_items(budget_id);

CREATE TRIGGER update_procurement_items_updated_at
  BEFORE UPDATE ON public.procurement_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

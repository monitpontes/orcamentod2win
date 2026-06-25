
-- Tornar orçamentos e itens de compra globais (compartilhados entre todos os usuários autenticados)
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Authenticated users can view all budgets" ON public.budgets
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create budgets" ON public.budgets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update any budget" ON public.budgets
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete any budget" ON public.budgets
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view their own procurement items" ON public.procurement_items;
DROP POLICY IF EXISTS "Users can insert their own procurement items" ON public.procurement_items;
DROP POLICY IF EXISTS "Users can update their own procurement items" ON public.procurement_items;
DROP POLICY IF EXISTS "Users can delete their own procurement items" ON public.procurement_items;

CREATE POLICY "Authenticated users can view all procurement items" ON public.procurement_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert procurement items" ON public.procurement_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update any procurement item" ON public.procurement_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete any procurement item" ON public.procurement_items
  FOR DELETE TO authenticated USING (true);

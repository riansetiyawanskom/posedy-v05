DROP POLICY IF EXISTS "Authenticated can view store_settings" ON public.store_settings;
CREATE POLICY "Anyone can view store_settings" ON public.store_settings FOR SELECT USING (true);
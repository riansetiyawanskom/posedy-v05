
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'POS System',
  phone text DEFAULT '',
  address text DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view store_settings" ON public.store_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update store_settings" ON public.store_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert store_settings" ON public.store_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed one default row
INSERT INTO public.store_settings (store_name, phone, address) VALUES ('POS System', '(021) 1234-5678', 'Jl. Contoh No. 123, Jakarta');

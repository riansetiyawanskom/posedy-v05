
-- Stock Opname Sessions
CREATE TABLE public.stock_opname_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number text NOT NULL,
  category_id uuid REFERENCES public.categories(id) NOT NULL,
  status text NOT NULL DEFAULT 'open',
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

ALTER TABLE public.stock_opname_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view opname sessions" ON public.stock_opname_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert opname sessions" ON public.stock_opname_sessions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update opname sessions" ON public.stock_opname_sessions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete opname sessions" ON public.stock_opname_sessions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Stock Adjustments (audit log per product per session)
CREATE TABLE public.stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.stock_opname_sessions(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) NOT NULL,
  product_name text NOT NULL,
  system_stock integer NOT NULL,
  physical_stock integer NOT NULL,
  difference integer NOT NULL GENERATED ALWAYS AS (physical_stock - system_stock) STORED,
  notes text,
  adjusted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view stock adjustments" ON public.stock_adjustments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert stock adjustments" ON public.stock_adjustments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update stock adjustments" ON public.stock_adjustments FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete stock adjustments" ON public.stock_adjustments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Function to generate opname session number
CREATE OR REPLACE FUNCTION public.generate_opname_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  RETURN 'SO-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$;

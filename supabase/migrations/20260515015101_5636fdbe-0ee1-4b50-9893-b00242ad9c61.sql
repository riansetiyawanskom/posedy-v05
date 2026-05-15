-- 1. customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view customers" ON public.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update customers" ON public.customers
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete customers" ON public.customers
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_customers_name ON public.customers(name);
CREATE INDEX idx_customers_phone ON public.customers(phone);

-- 2. orders.customer_id
ALTER TABLE public.orders ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);

-- 3. permission + role grants
INSERT INTO public.permissions (slug, description)
VALUES ('module:customers', 'Akses modul Pelanggan')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('admin', 'kasir')
  AND p.slug = 'module:customers'
ON CONFLICT DO NOTHING;
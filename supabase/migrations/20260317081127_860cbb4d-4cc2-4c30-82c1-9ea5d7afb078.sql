
-- Categories for organizing products
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url TEXT,
    sku TEXT UNIQUE,
    stock INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    cashier_id UUID REFERENCES auth.users(id),
    subtotal NUMERIC(10,2) NOT NULL,
    tax NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Order items
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    product_name TEXT NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Categories: readable by authenticated
CREATE POLICY "Authenticated can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Products: readable by authenticated, manageable by admin/editor
CREATE POLICY "Authenticated can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors can manage products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.check_user_permission(auth.uid(), 'post:create'));
CREATE POLICY "Editors can update products" ON public.products FOR UPDATE TO authenticated USING (public.check_user_permission(auth.uid(), 'post:update'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Orders: cashiers can create, view own; admins see all
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (cashier_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (cashier_id = auth.uid());

-- Order items: follow order access
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.cashier_id = auth.uid()));
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can create order items" ON public.order_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.cashier_id = auth.uid()));

-- Trigger for products updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate order number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'POS-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Seed categories
INSERT INTO public.categories (name, icon, sort_order) VALUES
    ('Makanan', 'utensils', 1),
    ('Minuman', 'coffee', 2),
    ('Snack', 'cookie', 3),
    ('Dessert', 'cake', 4);

-- Seed products
INSERT INTO public.products (name, price, category_id, sku, stock) VALUES
    ('Nasi Goreng', 25000, (SELECT id FROM public.categories WHERE name = 'Makanan'), 'MKN-001', 50),
    ('Mie Goreng', 22000, (SELECT id FROM public.categories WHERE name = 'Makanan'), 'MKN-002', 50),
    ('Ayam Bakar', 35000, (SELECT id FROM public.categories WHERE name = 'Makanan'), 'MKN-003', 30),
    ('Sate Ayam', 30000, (SELECT id FROM public.categories WHERE name = 'Makanan'), 'MKN-004', 40),
    ('Es Teh Manis', 5000, (SELECT id FROM public.categories WHERE name = 'Minuman'), 'MNM-001', 100),
    ('Kopi Susu', 15000, (SELECT id FROM public.categories WHERE name = 'Minuman'), 'MNM-002', 80),
    ('Jus Jeruk', 12000, (SELECT id FROM public.categories WHERE name = 'Minuman'), 'MNM-003', 60),
    ('Air Mineral', 4000, (SELECT id FROM public.categories WHERE name = 'Minuman'), 'MNM-004', 200),
    ('Keripik Singkong', 10000, (SELECT id FROM public.categories WHERE name = 'Snack'), 'SNK-001', 100),
    ('Pisang Goreng', 8000, (SELECT id FROM public.categories WHERE name = 'Snack'), 'SNK-002', 50),
    ('Es Krim', 15000, (SELECT id FROM public.categories WHERE name = 'Dessert'), 'DSR-001', 40),
    ('Pudding', 12000, (SELECT id FROM public.categories WHERE name = 'Dessert'), 'DSR-002', 30);

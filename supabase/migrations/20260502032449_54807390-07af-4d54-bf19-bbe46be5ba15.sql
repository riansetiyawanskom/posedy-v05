-- Fix products: allow admin INSERT/UPDATE via has_role (in addition to permission-based)
DROP POLICY IF EXISTS "Editors can manage products" ON public.products;
DROP POLICY IF EXISTS "Editors can update products" ON public.products;

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admin UPDATE & DELETE on orders
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admin UPDATE & DELETE on order_items
CREATE POLICY "Admins can update order_items"
ON public.order_items FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete order_items"
ON public.order_items FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admin DELETE on activity_logs (untuk maintenance log)
CREATE POLICY "Admins can delete activity_logs"
ON public.activity_logs FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow kasir to perform stock opname (sesuai requirement: kasir akses Stok Opname)
DROP POLICY IF EXISTS "Admins can insert opname sessions" ON public.stock_opname_sessions;
DROP POLICY IF EXISTS "Admins can update opname sessions" ON public.stock_opname_sessions;

CREATE POLICY "Authenticated can insert opname sessions"
ON public.stock_opname_sessions FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owner or admin can update opname sessions"
ON public.stock_opname_sessions FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert stock adjustments" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Admins can update stock adjustments" ON public.stock_adjustments;

CREATE POLICY "Authenticated can insert stock adjustments"
ON public.stock_adjustments FOR INSERT TO authenticated
WITH CHECK (adjusted_by = auth.uid());

CREATE POLICY "Owner or admin can update stock adjustments"
ON public.stock_adjustments FOR UPDATE TO authenticated
USING (adjusted_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Allow stock update during opname commit (kasir adjust stock)
CREATE POLICY "Authenticated can update product stock"
ON public.products FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

-- Add cost_price (HPP) to products for moving average tracking
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

-- ============ SUPPLIERS ============
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PURCHASE ORDERS ============
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  status text NOT NULL DEFAULT 'draft', -- draft, ordered, received, cancelled
  notes text,
  total numeric NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view purchase_orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert purchase_orders" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update purchase_orders" ON public.purchase_orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete purchase_orders" ON public.purchase_orders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PURCHASE ORDER ITEMS ============
CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_cost numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view purchase_order_items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert purchase_order_items" ON public.purchase_order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_orders WHERE id = purchase_order_items.purchase_order_id AND created_by = auth.uid()));
CREATE POLICY "Admins can update purchase_order_items" ON public.purchase_order_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete purchase_order_items" ON public.purchase_order_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ============ PO NUMBER GENERATOR ============
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'PO-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$;

-- ============ MOVING AVERAGE COST + STOCK UPDATE TRIGGER ============
-- Fires when purchase_order status changes to 'received'
CREATE OR REPLACE FUNCTION public.on_purchase_order_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  old_stock integer;
  old_cost numeric;
  new_cost numeric;
BEGIN
  -- Only run when status changes TO 'received'
  IF NEW.status = 'received' AND (OLD.status IS DISTINCT FROM 'received') THEN
    -- Set received timestamp
    NEW.received_at = now();

    -- Loop through all items in this PO
    FOR item IN
      SELECT product_id, quantity, unit_cost
      FROM public.purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      -- Get current stock and cost_price
      SELECT COALESCE(p.stock, 0), COALESCE(p.cost_price, 0)
      INTO old_stock, old_cost
      FROM public.products p
      WHERE p.id = item.product_id;

      -- Moving Average: new_cost = (old_cost * old_stock + unit_cost * qty) / (old_stock + qty)
      IF (old_stock + item.quantity) > 0 THEN
        new_cost = (old_cost * old_stock + item.unit_cost * item.quantity) / (old_stock + item.quantity);
      ELSE
        new_cost = item.unit_cost;
      END IF;

      -- Update product stock and cost_price
      UPDATE public.products
      SET stock = COALESCE(stock, 0) + item.quantity,
          cost_price = new_cost,
          updated_at = now()
      WHERE id = item.product_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_purchase_order_received
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.on_purchase_order_received();

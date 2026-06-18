
-- =========================================================
-- 1) BACKFILL HISTORIS (sekali jalan, sebelum trigger aktif)
-- =========================================================
-- Kurangi stok berdasarkan akumulasi penjualan completed
WITH sold AS (
  SELECT oi.product_id, SUM(oi.quantity)::int AS qty
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.status = 'completed'
  GROUP BY oi.product_id
)
UPDATE public.products p
SET stock = COALESCE(p.stock, 0) - s.qty,
    updated_at = now()
FROM sold s
WHERE p.id = s.product_id;

-- =========================================================
-- 2) TRIGGER: kurangi stok saat order_items di-INSERT
--    Hard block jika stok tidak cukup.
-- =========================================================
CREATE OR REPLACE FUNCTION public.reduce_stock_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock integer;
  v_name  text;
BEGIN
  -- Lock baris produk supaya tidak race-condition antar kasir
  SELECT stock, name INTO v_stock, v_name
  FROM public.products
  WHERE id = NEW.product_id
  FOR UPDATE;

  IF v_stock IS NULL THEN
    RAISE EXCEPTION 'Produk tidak ditemukan (id=%)', NEW.product_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Stok tidak cukup untuk %. Tersedia: %, diminta: %',
      v_name, v_stock, NEW.quantity
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.products
  SET stock = stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_reduce_stock ON public.order_items;
CREATE TRIGGER trg_order_items_reduce_stock
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.reduce_stock_on_sale();

-- =========================================================
-- 3) TRIGGER: kembalikan stok jika order dibatalkan/refund
-- =========================================================
CREATE OR REPLACE FUNCTION public.restore_stock_on_void()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('cancelled','refunded')
     AND OLD.status = 'completed' THEN
    UPDATE public.products p
    SET stock = COALESCE(p.stock,0) + oi.quantity,
        updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND p.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_restore_stock ON public.orders;
CREATE TRIGGER trg_order_status_restore_stock
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_void();

-- =========================================================
-- 4) RPC: process_sale — checkout atomic (1 round-trip)
-- =========================================================
CREATE OR REPLACE FUNCTION public.process_sale(
  p_payload jsonb,
  p_items   jsonb
)
RETURNS TABLE(order_id uuid, order_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id     uuid;
  v_order_number text;
  v_item         jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Tidak terautentikasi' USING ERRCODE = '28000';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang kosong' USING ERRCODE = 'P0001';
  END IF;

  v_order_number := COALESCE(
    NULLIF(p_payload->>'order_number',''),
    public.generate_order_number()
  );

  INSERT INTO public.orders(
    order_number, subtotal, tax, discount, total,
    payment_method, status, cashier_id, customer_id, notes
  ) VALUES (
    v_order_number,
    COALESCE((p_payload->>'subtotal')::numeric, 0),
    COALESCE((p_payload->>'tax')::numeric, 0),
    COALESCE((p_payload->>'discount')::numeric, 0),
    COALESCE((p_payload->>'total')::numeric, 0),
    COALESCE(p_payload->>'payment_method','cash'),
    'completed',
    auth.uid(),
    NULLIF(p_payload->>'customer_id','')::uuid,
    p_payload->>'notes'
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items(
      order_id, product_id, product_name, quantity, unit_price, subtotal
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric,
      (v_item->>'subtotal')::numeric
    );
    -- Trigger reduce_stock_on_sale akan validasi & kurangi stok.
    -- Jika gagal, seluruh transaksi rollback (order + items).
  END LOOP;

  RETURN QUERY SELECT v_order_id, v_order_number;
END;
$$;

REVOKE ALL ON FUNCTION public.process_sale(jsonb, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.process_sale(jsonb, jsonb) TO authenticated;

-- =========================================================
-- 5) RPC: void_order (admin only) — batalkan & restore stok
-- =========================================================
CREATE OR REPLACE FUNCTION public.void_order(
  p_order_id uuid,
  p_reason   text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Hanya admin yang boleh membatalkan pesanan' USING ERRCODE = '42501';
  END IF;

  SELECT status INTO v_status FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Pesanan tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;
  IF v_status <> 'completed' THEN
    RAISE EXCEPTION 'Hanya pesanan completed yang dapat dibatalkan (status saat ini: %)', v_status
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orders
  SET status = 'cancelled',
      notes  = COALESCE(notes,'') ||
               CASE WHEN p_reason IS NOT NULL
                    THEN E'\n[VOID] ' || p_reason
                    ELSE E'\n[VOID]' END
  WHERE id = p_order_id;
  -- Trigger restore_stock_on_void mengembalikan stok otomatis.
END;
$$;

REVOKE ALL ON FUNCTION public.void_order(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.void_order(uuid, text) TO authenticated;

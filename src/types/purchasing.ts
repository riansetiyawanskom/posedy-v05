export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: string;
  notes: string | null;
  total: number;
  created_by: string | null;
  received_at: string | null;
  created_at: string;
  suppliers?: { name: string };
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

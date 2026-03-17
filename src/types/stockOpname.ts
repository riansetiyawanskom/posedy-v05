export interface StockOpnameSession {
  id: string;
  session_number: string;
  category_id: string;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  closed_at: string | null;
  categories?: { name: string };
}

export interface StockAdjustment {
  id: string;
  session_id: string;
  product_id: string;
  product_name: string;
  system_stock: number;
  physical_stock: number;
  difference: number;
  notes: string | null;
  adjusted_by: string;
  created_at: string;
}

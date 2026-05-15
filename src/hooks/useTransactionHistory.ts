import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrderRow {
  id: string;
  order_number: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  cashier_id: string | null;
  customer_id: string | null;
  customer_name?: string | null;
  notes: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export function useTransactionHistory() {
  const ordersQuery = useQuery({
    queryKey: ["transaction-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(name)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return ((data ?? []) as any[]).map((o) => ({
        ...o,
        customer_name: o.customers?.name ?? null,
      })) as OrderRow[];
    },
  });

  const fetchOrderItems = async (orderId: string) => {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);
    if (error) throw error;
    return data as OrderItemRow[];
  };

  return {
    orders: ordersQuery.data ?? [],
    isLoading: ordersQuery.isLoading,
    refetch: ordersQuery.refetch,
    fetchOrderItems,
  };
}

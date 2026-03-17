import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Supplier, PurchaseOrder, PurchaseOrderItem } from "@/types/purchasing";

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, suppliers(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((po: any) => ({
        ...po,
        total: Number(po.total),
      }));
    },
  });
}

export function usePurchaseOrderItems(poId: string | null) {
  return useQuery({
    queryKey: ["purchase_order_items", poId],
    enabled: !!poId,
    queryFn: async (): Promise<PurchaseOrderItem[]> => {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select("*")
        .eq("purchase_order_id", poId!);
      if (error) throw error;
      return (data ?? []).map((i: any) => ({
        ...i,
        unit_cost: Number(i.unit_cost),
        subtotal: Number(i.subtotal),
      }));
    },
  });
}

export function useReceivePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (poId: string) => {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: "received" })
        .eq("id", poId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

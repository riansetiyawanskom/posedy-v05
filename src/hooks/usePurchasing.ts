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

export function useUpdatePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      poId,
      supplierId,
      notes,
      items,
    }: {
      poId: string;
      supplierId: string;
      notes: string | null;
      items: { product_id: string; product_name: string; quantity: number; unit_cost: number }[];
    }) => {
      const total = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

      // Update PO header
      const { error: poErr } = await supabase
        .from("purchase_orders")
        .update({ supplier_id: supplierId, notes, total })
        .eq("id", poId);
      if (poErr) throw poErr;

      // Delete old items then insert new
      const { error: delErr } = await supabase
        .from("purchase_order_items")
        .delete()
        .eq("purchase_order_id", poId);
      if (delErr) throw delErr;

      const poItems = items.map((i) => ({
        purchase_order_id: poId,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
        subtotal: i.quantity * i.unit_cost,
      }));

      if (poItems.length > 0) {
        const { error: insErr } = await supabase.from("purchase_order_items").insert(poItems);
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      qc.invalidateQueries({ queryKey: ["purchase_order_items"] });
    },
  });
}

export function useDeletePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (poId: string) => {
      // Delete items first
      const { error: itemErr } = await supabase
        .from("purchase_order_items")
        .delete()
        .eq("purchase_order_id", poId);
      if (itemErr) throw itemErr;

      const { error } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", poId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StockOpnameSession, StockAdjustment } from "@/types/stockOpname";

export function useOpnameSessions() {
  return useQuery({
    queryKey: ["opname_sessions"],
    queryFn: async (): Promise<StockOpnameSession[]> => {
      const { data, error } = await supabase
        .from("stock_opname_sessions")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStockAdjustments(sessionId: string | null) {
  return useQuery({
    queryKey: ["stock_adjustments", sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<StockAdjustment[]> => {
      const { data, error } = await supabase
        .from("stock_adjustments")
        .select("*")
        .eq("session_id", sessionId!)
        .order("product_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateOpnameSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { category_id: string; notes?: string; created_by: string }) => {
      // Generate session number
      const { data: numData, error: numError } = await supabase.rpc("generate_opname_number");
      if (numError) throw numError;

      const { data, error } = await supabase
        .from("stock_opname_sessions")
        .insert({
          session_number: numData,
          category_id: params.category_id,
          notes: params.notes || null,
          created_by: params.created_by,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opname_sessions"] });
    },
  });
}

export function useSubmitAdjustments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      session_id: string;
      adjustments: Array<{
        product_id: string;
        product_name: string;
        system_stock: number;
        physical_stock: number;
        notes?: string;
      }>;
      adjusted_by: string;
    }) => {
      const rows = params.adjustments.map((a) => ({
        session_id: params.session_id,
        product_id: a.product_id,
        product_name: a.product_name,
        system_stock: a.system_stock,
        physical_stock: a.physical_stock,
        notes: a.notes || null,
        adjusted_by: params.adjusted_by,
      }));

      const { error } = await supabase.from("stock_adjustments").insert(rows);
      if (error) throw error;

      // Update product stocks to match physical count
      for (const a of params.adjustments) {
        if (a.physical_stock !== a.system_stock) {
          const { error: upErr } = await supabase
            .from("products")
            .update({ stock: a.physical_stock, updated_at: new Date().toISOString() })
            .eq("id", a.product_id);
          if (upErr) throw upErr;
        }
      }

      // Close session
      const { error: closeErr } = await supabase
        .from("stock_opname_sessions")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", params.session_id);
      if (closeErr) throw closeErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opname_sessions"] });
      qc.invalidateQueries({ queryKey: ["stock_adjustments"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

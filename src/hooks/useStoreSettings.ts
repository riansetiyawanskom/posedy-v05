import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StoreSettings {
  id: string;
  store_name: string;
  phone: string;
  address: string;
  updated_at: string;
  updated_by: string | null;
}

export function useStoreSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as StoreSettings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: { store_name: string; phone: string; address: string }) => {
      if (!settings?.id) throw new Error("No settings row found");
      const { error } = await supabase
        .from("store_settings")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("Pengaturan toko berhasil disimpan");
    },
    onError: (err: any) => {
      toast.error("Gagal menyimpan: " + (err?.message ?? "Unknown error"));
    },
  });

  return { settings, isLoading, updateSettings: updateMutation.mutate, isUpdating: updateMutation.isPending };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyMessage";

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
      if (!settings?.id) throw new Error("Pengaturan toko belum tersedia. Coba muat ulang halaman.");
      const { error } = await supabase
        .from("store_settings")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("Pengaturan toko tersimpan ✓");
    },
    onError: (err) => {
      toast.error(friendlyError(err, "Pengaturan toko belum bisa disimpan. Silakan coba lagi."));
    },
  });

  return { settings, isLoading, updateSettings: updateMutation.mutate, isUpdating: updateMutation.isPending };
}

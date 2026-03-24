import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  module: string;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export function useActivityLogs(filters?: { module?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ["activity_logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters?.module) {
        query = query.eq("module", filters.module);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo + "T23:59:59");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityLog[];
    },
  });
}

export function useLogActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { action: string; module: string; description?: string; metadata?: Record<string, any> }) => {
      if (!user) return;
      const { error } = await supabase.from("activity_logs").insert({
        user_id: user.id,
        user_email: user.email ?? null,
        action: params.action,
        module: params.module,
        description: params.description ?? null,
        metadata: params.metadata ?? {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["my_roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role_id, roles(name)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).map((ur: any) => ur.roles?.name as string).filter(Boolean);
    },
    enabled: !!user,
  });

  const isAdmin = roles.includes("admin");
  const isKasir = roles.includes("kasir");

  return { roles, isAdmin, isKasir, isLoading };
}

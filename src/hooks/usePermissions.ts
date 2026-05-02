import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns the set of permission slugs the current user has,
 * computed from user_roles -> role_permissions -> permissions in DB.
 *
 * This is the single source of truth for module access — do NOT
 * hardcode role names anywhere in the UI.
 */
export function usePermissions() {
  const { user } = useAuth();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["my_permissions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("roles(role_permissions(permissions(slug)))")
        .eq("user_id", user.id);
      if (error) throw error;

      const slugs = new Set<string>();
      for (const ur of (data ?? []) as any[]) {
        const rps = ur.roles?.role_permissions ?? [];
        for (const rp of rps) {
          const slug = rp.permissions?.slug;
          if (slug) slugs.add(slug);
        }
      }
      return Array.from(slugs);
    },
    enabled: !!user,
  });

  const hasPermission = (slug: string) => permissions.includes(slug);
  const hasAny = (slugs: string[]) => slugs.some((s) => permissions.includes(s));

  return { permissions, hasPermission, hasAny, isLoading };
}

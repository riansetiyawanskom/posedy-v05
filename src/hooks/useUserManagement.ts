import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/friendlyMessage";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface UserRole {
  user_id: string;
  role_id: string;
}

export function useUserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Role[];
    },
  });

  const userRolesQuery = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role_id: roleId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      toast({ title: "Role berhasil ditambahkan ✓" });
    },
    onError: (err: Error) => {
      toast({ title: "Role belum bisa ditambahkan", description: friendlyError(err), variant: "destructive" });
    },
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role_id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      toast({ title: "Role berhasil dihapus ✓" });
    },
    onError: (err: Error) => {
      toast({ title: "Role belum bisa dihapus", description: friendlyError(err), variant: "destructive" });
    },
  });

  return {
    profiles: profilesQuery.data ?? [],
    roles: rolesQuery.data ?? [],
    userRoles: userRolesQuery.data ?? [],
    isLoading: profilesQuery.isLoading || rolesQuery.isLoading || userRolesQuery.isLoading,
    assignRole,
    removeRole,
  };
}

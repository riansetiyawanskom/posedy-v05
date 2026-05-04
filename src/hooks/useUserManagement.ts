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

async function invokeManageUsers(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("manage-users", { body: payload });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
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
      const { data, error } = await supabase.from("roles").select("*").order("name");
      if (error) throw error;
      return data as Role[];
    },
  });

  const userRolesQuery = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role_id: roleId });
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

  const createUser = useMutation({
    mutationFn: async (input: { email: string; password: string; full_name?: string; role_id?: string }) => {
      return invokeManageUsers({ action: "create", ...input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      toast({ title: "User baru berhasil dibuat ✓" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal membuat user", description: friendlyError(err), variant: "destructive" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (user_id: string) => invokeManageUsers({ action: "delete", user_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      toast({ title: "User berhasil dihapus ✓" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal menghapus user", description: friendlyError(err), variant: "destructive" });
    },
  });

  const resetUserPassword = useMutation({
    mutationFn: async (email: string) => invokeManageUsers({ action: "reset_password", email }),
    onSuccess: () => {
      toast({ title: "Tautan reset terkirim ✓", description: "Cek email user untuk lanjutkan." });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal mengirim reset", description: friendlyError(err), variant: "destructive" });
    },
  });

  const setUserPassword = useMutation({
    mutationFn: async (input: { user_id: string; password: string }) =>
      invokeManageUsers({ action: "set_password", ...input }),
    onSuccess: () => {
      toast({ title: "Kata sandi diperbarui ✓" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal mengganti kata sandi", description: friendlyError(err), variant: "destructive" });
    },
  });

  return {
    profiles: profilesQuery.data ?? [],
    roles: rolesQuery.data ?? [],
    userRoles: userRolesQuery.data ?? [],
    isLoading: profilesQuery.isLoading || rolesQuery.isLoading || userRolesQuery.isLoading,
    assignRole,
    removeRole,
    createUser,
    deleteUser,
    resetUserPassword,
    setUserPassword,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyMessage";

export interface ProductFormData {
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  category_id: string | null;
  image_url: string;
  is_active: boolean;
}

export interface CategoryFormData {
  name: string;
  icon: string;
  sort_order: number;
}

export function useAllProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: ProductFormData) => {
      const { error } = await supabase.from("products").insert({
        name: form.name,
        sku: form.sku || null,
        price: form.price,
        cost_price: form.cost_price,
        stock: form.stock,
        category_id: form.category_id || null,
        image_url: form.image_url || null,
        is_active: form.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produk baru ditambahkan ✓");
    },
    onError: (e) => toast.error(friendlyError(e, "Operasi belum berhasil. Silakan coba lagi.")),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: ProductFormData & { id: string }) => {
      const { error } = await supabase
        .from("products")
        .update({
          name: form.name,
          sku: form.sku || null,
          price: form.price,
          cost_price: form.cost_price,
          stock: form.stock,
          category_id: form.category_id || null,
          image_url: form.image_url || null,
          is_active: form.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Perubahan produk tersimpan ✓");
    },
    onError: (e) => toast.error(friendlyError(e, "Operasi belum berhasil. Silakan coba lagi.")),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Try hard delete first; if blocked by FK (product sudah dipakai di transaksi/PO/opname),
      // fallback ke soft delete (nonaktifkan produk) agar histori tetap utuh.
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        if (error.code === "23503") {
          const { error: softErr } = await supabase
            .from("products")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", id);
          if (softErr) throw softErr;
          return { soft: true };
        }
        throw error;
      }
      return { soft: false };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        res?.soft
          ? "Produk dinonaktifkan karena masih punya riwayat transaksi/PO/opname. Histori tetap aman."
          : "Produk dihapus ✓"
      );
    },
    onError: (e) => toast.error(friendlyError(e, "Operasi belum berhasil. Silakan coba lagi.")),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: CategoryFormData) => {
      const { error } = await supabase.from("categories").insert({
        name: form.name,
        icon: form.icon || null,
        sort_order: form.sort_order,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Kategori baru ditambahkan ✓");
    },
    onError: (e) => toast.error(friendlyError(e, "Operasi belum berhasil. Silakan coba lagi.")),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: CategoryFormData & { id: string }) => {
      const { error } = await supabase
        .from("categories")
        .update({
          name: form.name,
          icon: form.icon || null,
          sort_order: form.sort_order,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Perubahan kategori tersimpan ✓");
    },
    onError: (e) => toast.error(friendlyError(e, "Operasi belum berhasil. Silakan coba lagi.")),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Kategori dihapus ✓");
    },
    onError: (e) => toast.error(friendlyError(e, "Operasi belum berhasil. Silakan coba lagi.")),
  });
}

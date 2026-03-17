import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreateProduct, useUpdateProduct, type ProductFormData } from "@/hooks/useProductManagement";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any | null;
  categories: Array<{ id: string; name: string }>;
}

const empty: ProductFormData = {
  name: "",
  sku: "",
  price: 0,
  cost_price: 0,
  stock: 0,
  category_id: null,
  image_url: "",
  is_active: true,
};

export function ProductFormDialog({ open, onOpenChange, product, categories }: Props) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [form, setForm] = useState<ProductFormData>(empty);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!product;

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name ?? "",
        sku: product.sku ?? "",
        price: Number(product.price) || 0,
        cost_price: Number(product.cost_price) || 0,
        stock: product.stock ?? 0,
        category_id: product.category_id ?? null,
        image_url: product.image_url ?? "",
        is_active: product.is_active ?? true,
      });
      setPreview(product.image_url ?? null);
    } else {
      setForm(empty);
      setPreview(null);
    }
  }, [product, open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diizinkan");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast.error("Gagal upload: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setPreview(urlData.publicUrl);
    setUploading(false);
  };

  const removeImage = () => {
    setForm((f) => ({ ...f, image_url: "" }));
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (isEdit) {
      updateProduct.mutate({ id: product.id, ...form }, { onSuccess: () => onOpenChange(false) });
    } else {
      createProduct.mutate(form, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} maxLength={50} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Kategori</Label>
              <Select value={form.category_id ?? "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                <SelectTrigger id="category"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Harga Jual *</Label>
              <Input id="price" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost">HPP</Label>
              <Input id="cost" type="number" min={0} value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stok</Label>
              <Input id="stock" type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Gambar Produk</Label>
              {preview ? (
                <div className="relative inline-block">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-24 w-24 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  className="flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-accent hover:bg-accent/5"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-5 w-5" />
                      <span className="text-xs">Klik untuk upload</span>
                    </div>
                  )}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch id="active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label htmlFor="active">Produk aktif</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={isPending || uploading}>
              {isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

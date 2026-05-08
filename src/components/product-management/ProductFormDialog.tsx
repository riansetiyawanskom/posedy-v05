import { useEffect, useState, useRef, useCallback } from "react";
import { useCreateProduct, useUpdateProduct, type ProductFormData } from "@/hooks/useProductManagement";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "./ImageUpload";
import { BarcodeDisplay } from "./BarcodeDisplay";
import { ScanBarcode, Keyboard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useStoreSettings } from "@/hooks/useStoreSettings";

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
  const [scannerMode, setScannerMode] = useState(false);
  const skuInputRef = useRef<HTMLInputElement>(null);
  const scanBuffer = useRef("");
  const scanTimeout = useRef<ReturnType<typeof setTimeout>>();

  const { settings } = useStoreSettings();
  const marginEnabled = !!settings?.margin_enabled;
  const marginType = settings?.margin_type ?? "percentage";
  const marginValue = Number(settings?.margin_value ?? 0);

  const computePrice = (cost: number) => {
    if (!marginEnabled || !cost) return 0;
    if (marginType === "percentage") return Math.round(cost * (1 + marginValue / 100));
    return Math.round(cost + marginValue);
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
    } else {
      setForm({ ...empty });
    }
    setScannerMode(false);
  }, [product, open]);

  // Scanner listener when scannerMode is active
  const handleScannerKey = useCallback(
    (e: KeyboardEvent) => {
      if (!scannerMode || !open) return;
      // Ignore if user is typing in other inputs
      const target = e.target as HTMLElement;
      const isSkuInput = target === skuInputRef.current;
      if (!isSkuInput && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "Enter" && scanBuffer.current.length >= 3) {
        e.preventDefault();
        const scanned = scanBuffer.current.trim();
        scanBuffer.current = "";
        setForm((f) => ({ ...f, sku: scanned }));
        toast.success(`Barcode "${scanned}" berhasil di-scan`);
        setScannerMode(false);
        return;
      }

      if (e.key.length === 1) {
        scanBuffer.current += e.key;
        clearTimeout(scanTimeout.current);
        scanTimeout.current = setTimeout(() => {
          scanBuffer.current = "";
        }, 150);
      }
    },
    [scannerMode, open]
  );

  useEffect(() => {
    if (scannerMode) {
      window.addEventListener("keydown", handleScannerKey);
      return () => window.removeEventListener("keydown", handleScannerKey);
    }
  }, [scannerMode, handleScannerKey]);

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU / Barcode</Label>
              <div className="flex gap-1.5">
                <Input
                  id="sku"
                  ref={skuInputRef}
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  maxLength={50}
                  className="flex-1"
                  placeholder={scannerMode ? "Arahkan scanner..." : "Ketik atau scan barcode"}
                  readOnly={scannerMode}
                />
                <Button
                  type="button"
                  variant={scannerMode ? "default" : "outline"}
                  size="icon"
                  title={scannerMode ? "Mode scanner aktif — arahkan scanner barcode" : "Aktifkan mode scanner barcode"}
                  onClick={() => {
                    setScannerMode((v) => !v);
                    scanBuffer.current = "";
                    if (!scannerMode) {
                      toast.info("Mode scanner aktif. Arahkan scanner barcode ke produk.");
                    }
                  }}
                >
                  {scannerMode ? <ScanBarcode className="h-3.5 w-3.5 animate-pulse" /> : <Keyboard className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {scannerMode && (
                <p className="text-xs text-primary animate-pulse">🔍 Menunggu input dari scanner barcode...</p>
              )}
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
            <div className="space-y-1.5 sm:col-span-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Harga Jual *</Label>
                  <Input
                    id="price"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.price ? form.price.toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setForm({ ...form, price: raw ? Number(raw) : 0 });
                    }}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cost">HPP</Label>
                  <Input
                    id="cost"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.cost_price ? form.cost_price.toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setForm({ ...form, cost_price: raw ? Number(raw) : 0 });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stock">Stok</Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={form.stock === 0 ? "" : form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value === "" ? 0 : Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Barcode preview */}
            {form.sku && (
              <div className="sm:col-span-2 flex justify-center p-3 bg-muted/30 rounded-lg border border-border">
                <BarcodeDisplay value={form.sku} height={35} width={1.2} fontSize={11} />
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Gambar Produk</Label>
              <ImageUpload
                value={form.image_url || null}
                onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                onRemove={() => setForm((f) => ({ ...f, image_url: "" }))}
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch id="active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label htmlFor="active">Produk aktif</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

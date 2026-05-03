import { useState } from "react";
import { useSuppliers } from "@/hooks/usePurchasing";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyMessage";

interface LineItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
}

interface Props {
  onBack: () => void;
}

export function CreatePOForm({ onBack }: Props) {
  const { user } = useAuth();
  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts();
  const qc = useQueryClient();

  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  const addLine = () => {
    setItems([...items, { product_id: "", product_name: "", quantity: 1, unit_cost: 0 }]);
  };

  const updateLine = (idx: number, patch: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, ...patch };
        // Auto-fill product name
        if (patch.product_id && products) {
          const p = products.find((p) => p.id === patch.product_id);
          if (p) updated.product_name = p.name;
        }
        return updated;
      })
    );
  };

  const removeLine = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const total = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) {
      toast.warning("Mohon pilih supplier dan tambahkan minimal 1 item.");
      return;
    }

    setSaving(true);
    try {
      const { data: poNum } = await supabase.rpc("generate_po_number");
      const poNumber = poNum ?? `PO-${Date.now()}`;

      const { data: po, error: poErr } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: poNumber,
          supplier_id: supplierId,
          status: "draft",
          notes: notes || null,
          total,
          created_by: user?.id,
        })
        .select("id")
        .single();
      if (poErr) throw poErr;

      const poItems = items.map((i) => ({
        purchase_order_id: po.id,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
        subtotal: i.quantity * i.unit_cost,
      }));

      const { error: itemsErr } = await supabase.from("purchase_order_items").insert(poItems);
      if (itemsErr) throw itemsErr;

      toast.success(`PO ${poNumber} berhasil dibuat ✓`);
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      onBack();
    } catch (err: any) {
      toast.error(friendlyError(err, "PO belum bisa dibuat. Silakan coba lagi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-bold text-foreground">Buat Purchase Order Baru</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-5 pos-shadow">
        {/* Supplier */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Supplier *</label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Pilih supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers?.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Catatan</label>
          <Input placeholder="Catatan (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-card border-border" />
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Item Pembelian</label>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addLine}>
              <Plus className="h-3.5 w-3.5" />
              Tambah Item
            </Button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="flex flex-wrap items-end gap-2 rounded-lg bg-muted/50 p-3">
              <div className="flex-1 min-w-[160px] space-y-1">
                <label className="text-[10px] text-muted-foreground">Produk</label>
                <Select value={item.product_id} onValueChange={(v) => updateLine(idx, { product_id: v })}>
                  <SelectTrigger className="bg-card border-border h-9 text-xs">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20 space-y-1">
                <label className="text-[10px] text-muted-foreground">Qty</label>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 1 })}
                  className="bg-card border-border h-9 text-xs"
                />
              </div>
              <div className="w-32 space-y-1">
                <label className="text-[10px] text-muted-foreground">Harga Beli</label>
                <Input
                  type="number"
                  min={0}
                  value={item.unit_cost}
                  onChange={(e) => updateLine(idx, { unit_cost: Number(e.target.value) || 0 })}
                  className="bg-card border-border h-9 text-xs font-mono"
                />
              </div>
              <div className="w-28 text-right">
                <span className="font-mono text-xs font-bold text-card-foreground">
                  {formatRupiah(item.quantity * item.unit_cost)}
                </span>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeLine(idx)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {items.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
              Klik "Tambah Item" untuk menambahkan produk
            </div>
          )}
        </div>

        {/* Total */}
        {items.length > 0 && (
          <div className="flex justify-between rounded-lg bg-primary px-5 py-3">
            <span className="text-sm font-medium text-primary-foreground/70">Total</span>
            <span className="font-mono text-lg font-extrabold text-primary-foreground">{formatRupiah(total)}</span>
          </div>
        )}

        <Button variant="pos" size="lg" className="w-full" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Purchase Order
        </Button>
      </form>
    </div>
  );
}

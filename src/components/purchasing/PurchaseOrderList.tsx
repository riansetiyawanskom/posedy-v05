import { useState } from "react";
import { usePurchaseOrders, useReceivePO, useUpdatePO, useDeletePO, useSuppliers } from "@/hooks/usePurchasing";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Loader2, CheckCircle2, ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { format } from "date-fns";
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyMessage";
import type { PurchaseOrder, PurchaseOrderItem } from "@/types/purchasing";

const statusColors: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  ordered: "bg-primary/10 text-primary",
  received: "bg-accent/10 text-accent",
  cancelled: "bg-destructive/10 text-destructive",
};

interface Props {
  onCreateNew: () => void;
}

interface EditLineItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
}

export function PurchaseOrderList({ onCreateNew }: Props) {
  const { data: orders, isLoading } = usePurchaseOrders();
  const receiveMut = useReceivePO();
  const updateMut = useUpdatePO();
  const deleteMut = useDeletePO();
  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [itemsCache, setItemsCache] = useState<Record<string, PurchaseOrderItem[]>>({});

  // Edit state
  const [editPO, setEditPO] = useState<PurchaseOrder | null>(null);
  const [editSupplierId, setEditSupplierId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState<EditLineItem[]>([]);

  // Delete state
  const [deletePOId, setDeletePOId] = useState<string | null>(null);

  const handleReceive = async (poId: string) => {
    try {
      await receiveMut.mutateAsync(poId);
      toast.success("Barang diterima! Stok & HPP diperbarui.");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menerima barang");
    }
  };

  const toggleRow = async (poId: string) => {
    const next = new Set(expandedRows);
    if (next.has(poId)) {
      next.delete(poId);
    } else {
      next.add(poId);
      if (!itemsCache[poId]) {
        const { data } = await supabase
          .from("purchase_order_items")
          .select("*")
          .eq("purchase_order_id", poId);
        const items = (data ?? []).map((i: any) => ({
          ...i,
          unit_cost: Number(i.unit_cost),
          subtotal: Number(i.subtotal),
        }));
        setItemsCache((prev) => ({ ...prev, [poId]: items }));
      }
    }
    setExpandedRows(next);
  };

  const openEdit = async (po: PurchaseOrder) => {
    setEditPO(po);
    setEditSupplierId(po.supplier_id);
    setEditNotes(po.notes ?? "");

    // Load items if not cached
    let items = itemsCache[po.id];
    if (!items) {
      const { data } = await supabase
        .from("purchase_order_items")
        .select("*")
        .eq("purchase_order_id", po.id);
      items = (data ?? []).map((i: any) => ({
        ...i,
        unit_cost: Number(i.unit_cost),
        subtotal: Number(i.subtotal),
      }));
      setItemsCache((prev) => ({ ...prev, [po.id]: items! }));
    }
    setEditItems(items.map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_cost: i.unit_cost,
    })));
  };

  const updateEditLine = (idx: number, patch: Partial<EditLineItem>) => {
    setEditItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, ...patch };
        if (patch.product_id && products) {
          const p = products.find((p) => p.id === patch.product_id);
          if (p) updated.product_name = p.name;
        }
        return updated;
      })
    );
  };

  const handleSaveEdit = async () => {
    if (!editPO || !editSupplierId || editItems.length === 0) {
      toast.error("Pilih supplier dan minimal 1 item");
      return;
    }
    try {
      await updateMut.mutateAsync({
        poId: editPO.id,
        supplierId: editSupplierId,
        notes: editNotes || null,
        items: editItems,
      });
      // Update cache
      setItemsCache((prev) => {
        const { [editPO.id]: _, ...rest } = prev;
        return rest;
      });
      toast.success("PO berhasil diperbarui!");
      setEditPO(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal memperbarui PO");
    }
  };

  const handleDelete = async () => {
    if (!deletePOId) return;
    try {
      await deleteMut.mutateAsync(deletePOId);
      // Clean up expanded & cache
      setExpandedRows((prev) => { const n = new Set(prev); n.delete(deletePOId); return n; });
      setItemsCache((prev) => { const { [deletePOId]: _, ...rest } = prev; return rest; });
      toast.success("PO berhasil dihapus!");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menghapus PO");
    } finally {
      setDeletePOId(null);
    }
  };

  const editTotal = editItems.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Purchase Orders</h2>
        <Button variant="pos" size="sm" className="gap-1.5" onClick={onCreateNew}>
          <Plus className="h-3.5 w-3.5" />
          Buat PO Baru
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card pos-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-8 px-3 py-3" />
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No. PO</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden sm:table-cell">Supplier</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground hidden md:table-cell">Total</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!orders?.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Belum ada purchase order
                </td>
              </tr>
            ) : (
              orders.map((po) => {
                const isExpanded = expandedRows.has(po.id);
                const items = itemsCache[po.id];
                const isDraft = po.status === "draft";
                const canReceive = po.status === "draft" || po.status === "ordered";

                return (
                  <POExpandableRow
                    key={po.id}
                    po={po}
                    isExpanded={isExpanded}
                    items={items}
                    isDraft={isDraft}
                    canReceive={canReceive}
                    receivePending={receiveMut.isPending}
                    onToggle={() => toggleRow(po.id)}
                    onReceive={() => handleReceive(po.id)}
                    onEdit={() => openEdit(po)}
                    onDelete={() => setDeletePOId(po.id)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editPO} onOpenChange={(open) => !open && setEditPO(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit PO: {editPO?.po_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Supplier</label>
              <Select value={editSupplierId} onValueChange={setEditSupplierId}>
                <SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Catatan</label>
              <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Catatan (opsional)" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Item</label>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setEditItems([...editItems, { product_id: "", product_name: "", quantity: 1, unit_cost: 0 }])}>
                  <Plus className="h-3.5 w-3.5" /> Tambah
                </Button>
              </div>
              {editItems.map((item, idx) => (
                <div key={idx} className="flex flex-wrap items-end gap-2 rounded-lg bg-muted/50 p-3">
                  <div className="flex-1 min-w-[140px] space-y-1">
                    <label className="text-[10px] text-muted-foreground">Produk</label>
                    <Select value={item.product_id} onValueChange={(v) => updateEditLine(idx, { product_id: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 space-y-1">
                    <label className="text-[10px] text-muted-foreground">Qty</label>
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => updateEditLine(idx, { quantity: Number(e.target.value) || 1 })} className="h-9 text-xs" />
                  </div>
                  <div className="w-28 space-y-1">
                    <label className="text-[10px] text-muted-foreground">Harga</label>
                    <Input type="number" min={0} value={item.unit_cost} onChange={(e) => updateEditLine(idx, { unit_cost: Number(e.target.value) || 0 })} className="h-9 text-xs font-mono" />
                  </div>
                  <span className="w-24 text-right font-mono text-xs font-bold">{formatRupiah(item.quantity * item.unit_cost)}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setEditItems((p) => p.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {editItems.length > 0 && (
                <div className="flex justify-between rounded-lg bg-primary px-4 py-2.5">
                  <span className="text-sm text-primary-foreground/70">Total</span>
                  <span className="font-mono font-bold text-primary-foreground">{formatRupiah(editTotal)}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPO(null)}>Batal</Button>
            <Button onClick={handleSaveEdit} disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletePOId} onOpenChange={(open) => !open && setDeletePOId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Purchase Order?</AlertDialogTitle>
            <AlertDialogDescription>
              PO ini beserta semua item-nya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function POExpandableRow({
  po,
  isExpanded,
  items,
  isDraft,
  canReceive,
  receivePending,
  onToggle,
  onReceive,
  onEdit,
  onDelete,
}: {
  po: PurchaseOrder;
  isExpanded: boolean;
  items?: PurchaseOrderItem[];
  isDraft: boolean;
  canReceive: boolean;
  receivePending: boolean;
  onToggle: () => void;
  onReceive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-3 py-3">
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </td>
        <td className="px-4 py-3 font-mono text-xs font-medium text-card-foreground">{po.po_number}</td>
        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{po.suppliers?.name ?? "-"}</td>
        <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{format(new Date(po.created_at), "dd/MM/yyyy")}</td>
        <td className="px-4 py-3">
          <Badge variant="outline" className={statusColors[po.status] ?? ""}>{po.status}</Badge>
        </td>
        <td className="px-4 py-3 text-right font-mono text-card-foreground hidden md:table-cell">{formatRupiah(po.total)}</td>
        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {canReceive && (
              <Button variant="outline" size="sm" className="gap-1 text-accent border-accent/30 hover:bg-accent/10 h-7 text-xs" onClick={onReceive} disabled={receivePending}>
                <CheckCircle2 className="h-3 w-3" /> Terima
              </Button>
            )}
            {isDraft && (
              <>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={onEdit}>
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={onDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-muted/30 p-0">
            <div className="px-8 py-3">
              {po.notes && (
                <p className="text-xs text-muted-foreground mb-2 italic">Catatan: {po.notes}</p>
              )}
              {!items ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat item...
                </div>
              ) : items.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Tidak ada item</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left pb-1 font-medium">Produk</th>
                      <th className="text-right pb-1 font-medium">Qty</th>
                      <th className="text-right pb-1 font-medium">Harga Satuan</th>
                      <th className="text-right pb-1 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-border/50">
                        <td className="py-1.5">{item.product_name}</td>
                        <td className="text-right py-1.5">{item.quantity}</td>
                        <td className="text-right py-1.5">{formatRupiah(item.unit_cost)}</td>
                        <td className="text-right py-1.5 font-medium">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border">
                      <td colSpan={3} className="py-1.5 text-right font-semibold">Total</td>
                      <td className="py-1.5 text-right font-bold">{formatRupiah(po.total)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

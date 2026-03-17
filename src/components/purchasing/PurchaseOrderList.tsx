import { usePurchaseOrders, useReceivePO } from "@/hooks/usePurchasing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, CheckCircle2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  ordered: "bg-primary/10 text-primary",
  received: "bg-accent/10 text-accent",
  cancelled: "bg-destructive/10 text-destructive",
};

interface Props {
  onCreateNew: () => void;
}

export function PurchaseOrderList({ onCreateNew }: Props) {
  const { data: orders, isLoading } = usePurchaseOrders();
  const receiveMut = useReceivePO();

  const handleReceive = async (poId: string) => {
    try {
      await receiveMut.mutateAsync(poId);
      toast.success("Barang diterima! Stok & HPP diperbarui.");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menerima barang");
    }
  };

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
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No. PO</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden sm:table-cell">Supplier</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground hidden md:table-cell">Total</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!orders?.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Belum ada purchase order
                </td>
              </tr>
            ) : (
              orders.map((po) => (
                <tr key={po.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-card-foreground">{po.po_number}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{po.suppliers?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={statusColors[po.status] ?? ""}>
                      {po.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-card-foreground hidden md:table-cell">
                    {formatRupiah(po.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(po.status === "draft" || po.status === "ordered") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-accent border-accent/30 hover:bg-accent/10"
                        onClick={() => handleReceive(po.id)}
                        disabled={receiveMut.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Terima
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

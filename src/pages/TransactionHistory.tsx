import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useTransactionHistory, type OrderRow, type OrderItemRow } from "@/hooks/useTransactionHistory";
import { formatRupiah } from "@/lib/format";
import { printOrderReceipt } from "@/lib/printReceipt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Receipt, Loader2, Printer } from "lucide-react";

const methodLabel: Record<string, string> = {
  cash: "Tunai",
  card: "Kartu",
  ewallet: "E-Wallet",
};

export default function TransactionHistory() {
  const { orders, isLoading, fetchOrderItems } = useTransactionHistory();
  const [search, setSearch] = useState("");
  const [detailOrder, setDetailOrder] = useState<OrderRow | null>(null);
  const [detailItems, setDetailItems] = useState<OrderItemRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const filtered = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (methodLabel[o.payment_method] ?? o.payment_method)
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const handlePrint = async (order: OrderRow) => {
    const items = await fetchOrderItems(order.id);
    printOrderReceipt({
      orderNumber: order.order_number,
      date: formatDate(order.created_at),
      paymentMethod: order.payment_method,
      items: items.map((i) => ({
        name: i.product_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        subtotal: i.subtotal,
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      total: order.total,
    });
  };

  const handlePrintFromDetail = () => {
    if (!detailOrder) return;
    printOrderReceipt({
      orderNumber: detailOrder.order_number,
      date: formatDate(detailOrder.created_at),
      paymentMethod: detailOrder.payment_method,
      items: detailItems.map((i) => ({
        name: i.product_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        subtotal: i.subtotal,
      })),
      subtotal: detailOrder.subtotal,
      discount: detailOrder.discount,
      tax: detailOrder.tax,
      total: detailOrder.total,
    });
  };

  const handleViewDetail = async (order: OrderRow) => {
    setDetailOrder(order);
    setLoadingDetail(true);
    try {
      const items = await fetchOrderItems(order.id);
      setDetailItems(items);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AppLayout title="Riwayat Transaksi">
      <div className="p-4 lg:p-6 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari no. order atau metode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Badge variant="secondary" className="text-xs">
            {filtered.length} transaksi
          </Badge>
        </div>

        {/* Table */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <Receipt className="h-4 w-4 text-accent" /> Daftar Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Belum ada transaksi
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Order</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs font-semibold text-card-foreground">
                          {o.order_number}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(o.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {methodLabel[o.payment_method] ?? o.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-card-foreground">
                          {formatRupiah(o.total)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              o.status === "completed"
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {o.status === "completed" ? "Selesai" : o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetail(o)}
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePrint(o)}
                              title="Cetak Struk"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              Detail Transaksi — {detailOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal</p>
                  <p className="font-medium text-card-foreground">
                    {detailOrder ? formatDate(detailOrder.created_at) : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Metode</p>
                  <p className="font-medium text-card-foreground">
                    {detailOrder
                      ? methodLabel[detailOrder.payment_method] ?? detailOrder.payment_method
                      : ""}
                  </p>
                </div>
              </div>

              {/* Items table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm font-medium text-card-foreground">
                        {item.product_name}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatRupiah(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        {formatRupiah(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              {detailOrder && (
                <div className="space-y-1 rounded-lg bg-muted p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono">{formatRupiah(detailOrder.subtotal)}</span>
                  </div>
                  {detailOrder.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Diskon</span>
                      <span className="font-mono">-{formatRupiah(detailOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pajak</span>
                    <span className="font-mono">{formatRupiah(detailOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-bold">
                    <span>Total</span>
                    <span className="font-mono">{formatRupiah(detailOrder.total)}</span>
                  </div>
                </div>
              )}

              {/* Print button */}
              <Button onClick={handlePrintFromDetail} className="w-full gap-2">
                <Printer className="h-4 w-4" /> Cetak Struk
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

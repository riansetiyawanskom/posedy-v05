import { useState, useMemo } from "react";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { AppLayout } from "@/components/AppLayout";
import { useTransactionHistory, type OrderRow, type OrderItemRow } from "@/hooks/useTransactionHistory";
import { formatRupiah } from "@/lib/format";
import { printOrderReceipt } from "@/lib/printReceipt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Receipt, Loader2, Printer, CalendarIcon, Download, X, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyMessage";
import { usePermissions } from "@/hooks/usePermissions";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { cn } from "@/lib/utils";

const methodLabel: Record<string, string> = {
  cash: "Tunai",
  card: "Kartu",
  ewallet: "E-Wallet",
};

export default function TransactionHistory() {
  const { orders, isLoading, refetch, fetchOrderItems } = useTransactionHistory();
  const { hasPermission } = usePermissions();
  const canResetTransactions = hasPermission("action:reset_transactions");
  const { settings: storeSettings } = useStoreSettings();
  const [search, setSearch] = useState("");
  const [resetting, setResetting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<OrderItemRow[]>([]);
  const [loadingExpand, setLoadingExpand] = useState(false);

  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        (methodLabel[o.payment_method] ?? o.payment_method)
          .toLowerCase()
          .includes(search.toLowerCase());

      let matchDate = true;
      if (dateFrom || dateTo) {
        const orderDate = new Date(o.created_at);
        const from = dateFrom ? startOfDay(dateFrom) : new Date(0);
        const to = dateTo ? endOfDay(dateTo) : new Date(9999, 11, 31);
        matchDate = isWithinInterval(orderDate, { start: from, end: to });
      }

      return matchSearch && matchDate;
    });
  }, [orders, search, dateFrom, dateTo]);

  const handleToggleExpand = async (order: OrderRow) => {
    if (expandedId === order.id) {
      setExpandedId(null);
      setExpandedItems([]);
      return;
    }
    setExpandedId(order.id);
    setLoadingExpand(true);
    try {
      const items = await fetchOrderItems(order.id);
      setExpandedItems(items);
    } finally {
      setLoadingExpand(false);
    }
  };

  const handlePrint = async (order: OrderRow) => {
    let items: OrderItemRow[];
    if (expandedId === order.id && expandedItems.length > 0) {
      items = expandedItems;
    } else {
      items = await fetchOrderItems(order.id);
    }
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
      storeName: storeSettings?.store_name,
      storePhone: storeSettings?.phone,
      storeAddress: storeSettings?.address,
    });
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    const header = ["No. Order", "Tanggal", "Metode Bayar", "Subtotal", "Diskon", "Pajak", "Total", "Status"];
    const rows = filtered.map((o) => [
      o.order_number,
      formatDate(o.created_at),
      methodLabel[o.payment_method] ?? o.payment_method,
      o.subtotal,
      o.discount,
      o.tax,
      o.total,
      o.status === "completed" ? "Selesai" : o.status,
    ]);

    const csvContent = [
      header.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    const dateLabel = dateFrom || dateTo
      ? `_${dateFrom ? format(dateFrom, "yyyyMMdd") : "awal"}-${dateTo ? format(dateTo, "yyyyMMdd") : "akhir"}`
      : `_${format(new Date(), "yyyyMMdd")}`;

    a.href = url;
    a.download = `laporan-transaksi${dateLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("reset-transaction-data", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      toast.success("Data transaksi berhasil direset ✓");
      setExpandedId(null);
      setExpandedItems([]);
      refetch();
    } catch (err) {
      toast.error(friendlyError(err, "Data transaksi belum bisa direset. Silakan coba lagi."));
    } finally {
      setResetting(false);
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

  const totalRevenue = filtered.reduce((sum, o) => sum + o.total, 0);

  return (
    <AppLayout title="Riwayat Transaksi">
      <div className="p-4 lg:p-6 space-y-4">
        {/* Filters row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari no. order atau metode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[160px] justify-start text-left font-normal text-sm",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: localeId }) : "Dari tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[160px] justify-start text-left font-normal text-sm",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {dateTo ? format(dateTo, "dd MMM yyyy", { locale: localeId }) : "Sampai tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="icon" onClick={clearDateFilter} title="Hapus filter tanggal">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {filtered.length} transaksi • {formatRupiah(totalRevenue)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            {canResetTransactions && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5" disabled={resetting || orders.length === 0}>
                    <Trash2 className="h-3.5 w-3.5" /> Reset Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Data Transaksi?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Semua data transaksi (orders & order items) akan dihapus permanen. Data laporan penjualan dan rugi laba juga akan terpengaruh. Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {resetting ? "Mereset..." : "Ya, Reset Semua"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
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
                      <TableHead className="w-8"></TableHead>
                      <TableHead>No. Order</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((o) => {
                      const isExpanded = expandedId === o.id;
                      return (
                        <>
                          <TableRow
                            key={o.id}
                            className={cn("cursor-pointer hover:bg-muted/50", isExpanded && "bg-muted/30")}
                            onClick={() => handleToggleExpand(o)}
                          >
                            <TableCell className="w-8 px-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrint(o);
                                }}
                                title="Cetak Struk"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Expanded detail panel */}
                          {isExpanded && (
                            <TableRow key={`${o.id}-detail`}>
                              <TableCell colSpan={7} className="p-0 border-b border-border">
                                <div className="bg-muted/20 px-6 py-4 space-y-3">
                                  {loadingExpand ? (
                                    <div className="flex justify-center py-4">
                                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                  ) : (
                                    <>
                                      {/* Detail info */}
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                        <div>
                                          <p className="text-xs text-muted-foreground">No. Order</p>
                                          <p className="font-mono font-semibold text-card-foreground">{o.order_number}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Tanggal</p>
                                          <p className="font-medium text-card-foreground">{formatDate(o.created_at)}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Metode Bayar</p>
                                          <p className="font-medium text-card-foreground">
                                            {methodLabel[o.payment_method] ?? o.payment_method}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Status</p>
                                          <Badge
                                            variant="outline"
                                            className={
                                              o.status === "completed"
                                                ? "bg-accent/20 text-accent-foreground border-accent"
                                                : ""
                                            }
                                          >
                                            {o.status === "completed" ? "Selesai" : o.status}
                                          </Badge>
                                        </div>
                                      </div>

                                      {/* Items table */}
                                      <div className="rounded-md border border-border overflow-hidden">
                                        <Table>
                                          <TableHeader>
                                            <TableRow className="bg-muted/50">
                                              <TableHead className="text-xs">Produk</TableHead>
                                              <TableHead className="text-xs text-center">Qty</TableHead>
                                              <TableHead className="text-xs text-right">Harga</TableHead>
                                              <TableHead className="text-xs text-right">Subtotal</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {expandedItems.map((item) => (
                                              <TableRow key={item.id}>
                                                <TableCell className="text-sm font-medium text-card-foreground">
                                                  {item.product_name}
                                                </TableCell>
                                                <TableCell className="text-center text-sm">{item.quantity}</TableCell>
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
                                      </div>

                                      {/* Summary */}
                                      <div className="flex justify-end">
                                        <div className="w-full max-w-xs space-y-1 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="font-mono">{formatRupiah(o.subtotal)}</span>
                                          </div>
                                          {o.discount > 0 && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Diskon</span>
                                              <span className="font-mono">-{formatRupiah(o.discount)}</span>
                                            </div>
                                          )}
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Pajak</span>
                                            <span className="font-mono">{formatRupiah(o.tax)}</span>
                                          </div>
                                          <div className="flex justify-between border-t border-border pt-2 font-bold">
                                            <span>Total</span>
                                            <span className="font-mono">{formatRupiah(o.total)}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Print button */}
                                      <div className="flex justify-end">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="gap-1.5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePrint(o);
                                          }}
                                        >
                                          <Printer className="h-3.5 w-3.5" /> Cetak Struk
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

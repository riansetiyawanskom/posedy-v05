import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, isWithinInterval, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, ChevronDown, ChevronRight, Download, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const methodLabel: Record<string, string> = {
  cash: "Tunai",
  qris: "QRIS",
  transfer: "Transfer",
  debit: "Debit",
};

export function SalesReport() {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [itemsCache, setItemsCache] = useState<Record<string, OrderItem[]>>({});

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["report-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.created_at!);
      if (dateFrom && dateTo) {
        return isWithinInterval(d, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
      }
      if (dateFrom) return d >= startOfDay(dateFrom);
      if (dateTo) return d <= endOfDay(dateTo);
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, o) => ({
        revenue: acc.revenue + Number(o.total),
        orders: acc.orders + 1,
        tax: acc.tax + Number(o.tax),
        discount: acc.discount + Number(o.discount),
      }),
      { revenue: 0, orders: 0, tax: 0, discount: 0 }
    );
  }, [filtered]);

  const toggleRow = async (orderId: string) => {
    const next = new Set(expandedRows);
    if (next.has(orderId)) {
      next.delete(orderId);
    } else {
      next.add(orderId);
      if (!itemsCache[orderId]) {
        const { data } = await supabase
          .from("order_items")
          .select("id, product_name, quantity, unit_price, subtotal")
          .eq("order_id", orderId);
        setItemsCache((prev) => ({ ...prev, [orderId]: (data as OrderItem[]) ?? [] }));
      }
    }
    setExpandedRows(next);
  };

  const handleExport = () => {
    const bom = "\uFEFF";
    const header = "No,Tanggal,No Order,Metode,Subtotal,Pajak,Diskon,Total\n";
    const rows = filtered.map((o, i) =>
      [
        i + 1,
        format(new Date(o.created_at!), "dd/MM/yyyy HH:mm"),
        o.order_number,
        methodLabel[o.payment_method] ?? o.payment_method,
        o.subtotal,
        o.tax,
        o.discount,
        o.total,
      ].join(",")
    );
    const blob = new Blob([bom + header + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-penjualan-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: localeId }) : "Dari"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground text-sm">—</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateTo ? format(dateTo, "dd MMM yyyy", { locale: localeId }) : "Sampai"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
          Reset
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary">{totals.orders} transaksi • {formatRupiah(totals.revenue)}</Badge>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total Penjualan</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{formatRupiah(totals.revenue)}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Jumlah Order</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{totals.orders}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total Pajak</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{formatRupiah(totals.tax)}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total Diskon</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{formatRupiah(totals.discount)}</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Tanggal</TableHead>
              <TableHead>No Order</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Pajak</TableHead>
              <TableHead className="text-right">Diskon</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Tidak ada data</TableCell></TableRow>
            )}
            {filtered.map((o) => {
              const isExpanded = expandedRows.has(o.id);
              const items = itemsCache[o.id];
              return (
                <ExpandableOrderRow
                  key={o.id}
                  order={o}
                  isExpanded={isExpanded}
                  items={items}
                  onToggle={() => toggleRow(o.id)}
                />
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ExpandableOrderRow({
  order,
  isExpanded,
  items,
  onToggle,
}: {
  order: any;
  isExpanded: boolean;
  items?: OrderItem[];
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell className="w-8">
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="text-sm">{format(new Date(order.created_at!), "dd/MM/yyyy HH:mm")}</TableCell>
        <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
        <TableCell><Badge variant="outline" className="text-xs">{methodLabel[order.payment_method] ?? order.payment_method}</Badge></TableCell>
        <TableCell className="text-right text-sm">{formatRupiah(Number(order.subtotal))}</TableCell>
        <TableCell className="text-right text-sm">{formatRupiah(Number(order.tax))}</TableCell>
        <TableCell className="text-right text-sm">{formatRupiah(Number(order.discount))}</TableCell>
        <TableCell className="text-right font-semibold text-sm">{formatRupiah(Number(order.total))}</TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30 p-0">
            <div className="px-8 py-3">
              {!items ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat item...
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left pb-1 font-medium">Produk</th>
                      <th className="text-right pb-1 font-medium">Qty</th>
                      <th className="text-right pb-1 font-medium">Harga</th>
                      <th className="text-right pb-1 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-border/50">
                        <td className="py-1.5">{item.product_name}</td>
                        <td className="text-right py-1.5">{item.quantity}</td>
                        <td className="text-right py-1.5">{formatRupiah(Number(item.unit_price))}</td>
                        <td className="text-right py-1.5 font-medium">{formatRupiah(Number(item.subtotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, isWithinInterval, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Download, Loader2, TrendingUp, TrendingDown, DollarSign, MinusCircle } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function ProfitLossReport() {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  // Fetch completed orders with items
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["pnl-orders"],
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

  const { data: orderItems = [] } = useQuery({
    queryKey: ["pnl-order-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("order_id, product_id, quantity, unit_price, subtotal")
        .limit(5000);
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["pnl-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, cost_price");
      if (error) throw error;
      return data;
    },
  });

  // Fetch received purchase orders (expenses)
  const { data: purchaseOrders = [], isLoading: loadingPO } = useQuery({
    queryKey: ["pnl-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("status", "received")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingOrders || loadingPO;

  const pnl = useMemo(() => {
    const costMap = new Map(products.map((p) => [p.id, Number(p.cost_price)]));

    const filteredOrders = orders.filter((o) => {
      const d = new Date(o.created_at!);
      if (dateFrom && dateTo) return isWithinInterval(d, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
      if (dateFrom) return d >= startOfDay(dateFrom);
      if (dateTo) return d <= endOfDay(dateTo);
      return true;
    });

    const orderIds = new Set(filteredOrders.map((o) => o.id));

    const revenue = filteredOrders.reduce((s, o) => s + Number(o.subtotal), 0);
    const tax = filteredOrders.reduce((s, o) => s + Number(o.tax), 0);
    const discount = filteredOrders.reduce((s, o) => s + Number(o.discount), 0);

    // COGS from order items
    const cogs = orderItems
      .filter((i) => orderIds.has(i.order_id))
      .reduce((s, i) => {
        const cost = costMap.get(i.product_id) ?? 0;
        return s + cost * i.quantity;
      }, 0);

    const grossProfit = revenue - cogs;

    // Purchase expenses in period
    const filteredPO = purchaseOrders.filter((po) => {
      if (!po.received_at) return false;
      const d = new Date(po.received_at);
      if (dateFrom && dateTo) return isWithinInterval(d, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
      if (dateFrom) return d >= startOfDay(dateFrom);
      if (dateTo) return d <= endOfDay(dateTo);
      return true;
    });
    const purchaseTotal = filteredPO.reduce((s, po) => s + Number(po.total), 0);

    const netProfit = grossProfit - discount + tax;

    return { revenue, cogs, grossProfit, tax, discount, purchaseTotal, netProfit, orderCount: filteredOrders.length };
  }, [orders, orderItems, products, purchaseOrders, dateFrom, dateTo]);

  const handleExport = () => {
    const bom = "\uFEFF";
    const period = `${dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Awal"} - ${dateTo ? format(dateTo, "dd/MM/yyyy") : "Akhir"}`;
    const lines = [
      `Laporan Rugi Laba`,
      `Periode: ${period}`,
      ``,
      `Keterangan,Jumlah`,
      `Pendapatan Penjualan,${pnl.revenue}`,
      `Harga Pokok Penjualan (HPP),-${pnl.cogs}`,
      `Laba Kotor,${pnl.grossProfit}`,
      `Pajak (PPN),${pnl.tax}`,
      `Diskon,-${pnl.discount}`,
      `Laba Bersih,${pnl.netProfit}`,
      ``,
      `Total Pembelian (diterima),${pnl.purchaseTotal}`,
    ];
    const blob = new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-rugi-laba-${format(new Date(), "yyyyMMdd")}.csv`;
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
        <div className="ml-auto">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Pendapatan</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold">{formatRupiah(pnl.revenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><MinusCircle className="h-3 w-3" /> HPP</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold">{formatRupiah(pnl.cogs)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Laba Kotor</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold">{formatRupiah(pnl.grossProfit)}</p></CardContent>
        </Card>
        <Card className={cn(pnl.netProfit < 0 && "border-destructive/50")}>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
            {pnl.netProfit >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} Laba Bersih
          </CardTitle></CardHeader>
          <CardContent><p className={cn("text-lg font-bold", pnl.netProfit < 0 && "text-destructive")}>{formatRupiah(pnl.netProfit)}</p></CardContent>
        </Card>
      </div>

      {/* P&L Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Neraca Rugi Laba</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Pendapatan Penjualan ({pnl.orderCount} order)</TableCell>
                <TableCell className="text-right font-semibold">{formatRupiah(pnl.revenue)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground pl-8">Harga Pokok Penjualan (HPP)</TableCell>
                <TableCell className="text-right text-destructive">-{formatRupiah(pnl.cogs)}</TableCell>
              </TableRow>
              <TableRow className="bg-muted/30">
                <TableCell className="font-semibold">Laba Kotor</TableCell>
                <TableCell className="text-right font-bold">{formatRupiah(pnl.grossProfit)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground pl-8">Pajak (PPN)</TableCell>
                <TableCell className="text-right">{formatRupiah(pnl.tax)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground pl-8">Diskon</TableCell>
                <TableCell className="text-right text-destructive">-{formatRupiah(pnl.discount)}</TableCell>
              </TableRow>
              <TableRow className="border-t-2 border-foreground/20 bg-muted/50">
                <TableCell className="font-bold text-base">Laba Bersih</TableCell>
                <TableCell className={cn("text-right font-bold text-base", pnl.netProfit < 0 ? "text-destructive" : "text-accent")}>
                  {formatRupiah(pnl.netProfit)}
                </TableCell>
              </TableRow>
              <TableRow className="border-t">
                <TableCell className="text-muted-foreground italic">Total Pembelian Diterima (periode ini)</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatRupiah(pnl.purchaseTotal)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

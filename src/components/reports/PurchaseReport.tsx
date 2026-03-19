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

interface POItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  ordered: "bg-blue-100 text-blue-700",
  received: "bg-green-100 text-green-700",
};

export function PurchaseReport() {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [itemsCache, setItemsCache] = useState<Record<string, POItem[]>>({});

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["report-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, suppliers(name)")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    return pos.filter((po) => {
      const d = new Date(po.created_at);
      if (dateFrom && dateTo) return isWithinInterval(d, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
      if (dateFrom) return d >= startOfDay(dateFrom);
      if (dateTo) return d <= endOfDay(dateTo);
      return true;
    });
  }, [pos, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const received = filtered.filter((p) => p.status === "received");
    return {
      count: filtered.length,
      totalAll: filtered.reduce((s, p) => s + Number(p.total), 0),
      totalReceived: received.reduce((s, p) => s + Number(p.total), 0),
      receivedCount: received.length,
    };
  }, [filtered]);

  const toggleRow = async (poId: string) => {
    const next = new Set(expandedRows);
    if (next.has(poId)) {
      next.delete(poId);
    } else {
      next.add(poId);
      if (!itemsCache[poId]) {
        const { data } = await supabase
          .from("purchase_order_items")
          .select("id, product_name, quantity, unit_cost, subtotal")
          .eq("purchase_order_id", poId);
        setItemsCache((prev) => ({ ...prev, [poId]: (data as POItem[]) ?? [] }));
      }
    }
    setExpandedRows(next);
  };

  const handleExport = () => {
    const bom = "\uFEFF";
    const header = "No,Tanggal,No PO,Supplier,Status,Total\n";
    const rows = filtered.map((po, i) =>
      [
        i + 1,
        format(new Date(po.created_at), "dd/MM/yyyy"),
        po.po_number,
        (po.suppliers as any)?.name ?? "-",
        po.status,
        po.total,
      ].join(",")
    );
    const blob = new Blob([bom + header + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-pembelian-${format(new Date(), "yyyyMMdd")}.csv`;
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
          <Badge variant="secondary">{totals.count} PO • {formatRupiah(totals.totalAll)}</Badge>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total PO</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{totals.count}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Nilai Total</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{formatRupiah(totals.totalAll)}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">PO Diterima</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{totals.receivedCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Nilai Diterima</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{formatRupiah(totals.totalReceived)}</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Tanggal</TableHead>
              <TableHead>No PO</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Tidak ada data</TableCell></TableRow>
            )}
            {filtered.map((po) => {
              const isExpanded = expandedRows.has(po.id);
              const items = itemsCache[po.id];
              return (
                <ExpandablePORow key={po.id} po={po} isExpanded={isExpanded} items={items} onToggle={() => toggleRow(po.id)} />
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ExpandablePORow({
  po,
  isExpanded,
  items,
  onToggle,
}: {
  po: any;
  isExpanded: boolean;
  items?: POItem[];
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell className="w-8">
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="text-sm">{format(new Date(po.created_at), "dd/MM/yyyy")}</TableCell>
        <TableCell className="font-mono text-xs">{po.po_number}</TableCell>
        <TableCell className="text-sm">{(po.suppliers as any)?.name ?? "-"}</TableCell>
        <TableCell>
          <Badge className={statusColors[po.status] ?? ""} variant="secondary">
            {po.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-semibold text-sm">{formatRupiah(Number(po.total))}</TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30 p-0">
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
                      <th className="text-right pb-1 font-medium">Harga Satuan</th>
                      <th className="text-right pb-1 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-border/50">
                        <td className="py-1.5">{item.product_name}</td>
                        <td className="text-right py-1.5">{item.quantity}</td>
                        <td className="text-right py-1.5">{formatRupiah(Number(item.unit_cost))}</td>
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

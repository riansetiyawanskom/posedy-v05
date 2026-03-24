import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useActivityLogs } from "@/hooks/useActivityLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const MODULE_OPTIONS = [
  { value: "", label: "Semua Modul" },
  { value: "pos", label: "POS Kasir" },
  { value: "products", label: "Produk" },
  { value: "purchasing", label: "Pembelian" },
  { value: "stock_opname", label: "Stok Opname" },
  { value: "transactions", label: "Riwayat" },
  { value: "users", label: "User" },
  { value: "auth", label: "Autentikasi" },
];

const ACTION_COLORS: Record<string, string> = {
  login: "default",
  logout: "secondary",
  create: "default",
  update: "secondary",
  delete: "destructive",
  view: "outline",
  print: "outline",
  export: "outline",
};

export default function ActivityLogs() {
  const [moduleFilter, setModuleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: logs = [], isLoading } = useActivityLogs({
    module: moduleFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.user_email?.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <AppLayout title="Log Aktivitas">
      <div className="p-4 lg:p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari log..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter modul" />
            </SelectTrigger>
            <SelectContent>
              {MODULE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value || "all"}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[160px]"
            placeholder="Dari"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[160px]"
            placeholder="Sampai"
          />
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <ScrollText className="h-5 w-5 text-accent" />
              Log Aktivitas
              <Badge variant="outline" className="ml-2">{filtered.length} record</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Memuat log...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Tidak ada log ditemukan</p>
            ) : (
              <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Waktu</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Aksi</TableHead>
                      <TableHead>Modul</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                        </TableCell>
                        <TableCell className="text-sm">{log.user_email ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={(ACTION_COLORS[log.action] as any) ?? "outline"} className="text-xs">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {log.module}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                          {log.description ?? "—"}
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
    </AppLayout>
  );
}

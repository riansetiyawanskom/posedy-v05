import { ArrowLeft, LayoutDashboard, LogOut, TrendingUp, ShoppingCart, Package, AlertTriangle, DollarSign, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const formatShortRupiah = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
};

const chartTooltipFormatter = (value: number) => formatRupiah(value);

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { dailySales, summary, lowStockProducts, purchaseTrend, isLoading } = useDashboard();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
        <div className="flex items-center gap-2.5">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <LayoutDashboard className="h-4 w-4 text-accent-foreground" />
          </div>
          <h1 className="text-base font-extrabold tracking-tight text-card-foreground">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={signOut} title="Keluar">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">Memuat dashboard...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="Penjualan Hari Ini"
                value={formatRupiah(summary?.todayRevenue ?? 0)}
                subtitle={`${summary?.todayOrderCount ?? 0} transaksi`}
                icon={<ShoppingCart className="h-4 w-4" />}
                accent
              />
              <SummaryCard
                title="Penjualan Bulan Ini"
                value={formatRupiah(summary?.monthRevenue ?? 0)}
                subtitle={`${summary?.monthOrderCount ?? 0} transaksi`}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <SummaryCard
                title="Pembelian Bulan Ini"
                value={formatRupiah(summary?.monthPurchaseTotal ?? 0)}
                subtitle={`${summary?.monthPurchaseCount ?? 0} PO diterima`}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <SummaryCard
                title="Stok Rendah"
                value={String(lowStockProducts.length)}
                subtitle="produk perlu restock"
                icon={<AlertTriangle className="h-4 w-4" />}
                warning={lowStockProducts.length > 0}
              />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sales Trend Chart */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    Tren Penjualan (30 Hari)
                  </CardTitle>
                  <CardDescription>Revenue dan profit harian</CardDescription>
                </CardHeader>
                <CardContent>
                  {dailySales.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data penjualan</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={dailySales}>
                        <defs>
                          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(220, 65%, 18%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(220, 65%, 18%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(155, 60%, 40%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(155, 60%, 40%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
                          tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
                          tickFormatter={formatShortRupiah}
                          width={50}
                        />
                        <Tooltip formatter={chartTooltipFormatter} labelFormatter={(l) => `Tanggal: ${l}`} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="hsl(220, 65%, 18%)"
                          fill="url(#gradRevenue)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="profit"
                          name="Profit"
                          stroke="hsl(155, 60%, 40%)"
                          fill="url(#gradProfit)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Purchase Trend Chart */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                    <Package className="h-4 w-4 text-accent" />
                    Tren Pembelian (6 Bulan)
                  </CardTitle>
                  <CardDescription>Total nilai PO yang diterima per bulan</CardDescription>
                </CardHeader>
                <CardContent>
                  {purchaseTrend.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data pembelian</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={purchaseTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
                          tickFormatter={formatShortRupiah}
                          width={50}
                        />
                        <Tooltip formatter={chartTooltipFormatter} labelFormatter={(l) => `Bulan: ${l}`} />
                        <Bar
                          dataKey="total"
                          name="Total Pembelian"
                          fill="hsl(220, 65%, 18%)"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Low Stock Table */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Produk Stok Rendah
                </CardTitle>
                <CardDescription>Produk dengan stok ≤ 10 unit yang perlu segera di-restock</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Semua produk memiliki stok cukup 👍
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Stok</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-card-foreground">{p.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {p.category_name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-card-foreground">
                            {p.stock}
                          </TableCell>
                          <TableCell className="text-right">
                            {p.stock === 0 ? (
                              <Badge variant="destructive">Habis</Badge>
                            ) : p.stock <= 5 ? (
                              <Badge className="bg-[hsl(var(--pos-warning))] text-primary-foreground">Kritis</Badge>
                            ) : (
                              <Badge variant="secondary">Rendah</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  warning,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <Card className={`border-border ${accent ? "bg-primary text-primary-foreground" : "bg-card"}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className={`text-xs font-medium ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {title}
          </p>
          <div className={`rounded-lg p-2 ${accent ? "bg-primary-foreground/10" : warning ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
            {icon}
          </div>
        </div>
        <p className={`mt-2 text-2xl font-extrabold tracking-tight ${accent ? "" : "text-card-foreground"}`}>
          {value}
        </p>
        <p className={`mt-0.5 text-xs ${accent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}

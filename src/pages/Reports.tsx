import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/AppLayout";
import { ShoppingCart, Truck, TrendingUp } from "lucide-react";
import { PurchaseReport } from "@/components/reports/PurchaseReport";
import { SalesReport } from "@/components/reports/SalesReport";
import { ProfitLossReport } from "@/components/reports/ProfitLossReport";

export default function Reports() {
  return (
    <AppLayout title="Laporan">
      <div className="p-4 lg:p-6">
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales" className="gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              Penjualan
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Pembelian
            </TabsTrigger>
            <TabsTrigger value="pnl" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Rugi Laba
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sales">
            <SalesReport />
          </TabsContent>
          <TabsContent value="purchases">
            <PurchaseReport />
          </TabsContent>
          <TabsContent value="pnl">
            <ProfitLossReport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

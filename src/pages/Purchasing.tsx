import { useState } from "react";
import { Store, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierList } from "@/components/purchasing/SupplierList";
import { PurchaseOrderList } from "@/components/purchasing/PurchaseOrderList";
import { CreatePOForm } from "@/components/purchasing/CreatePOForm";
import { AppLayout } from "@/components/AppLayout";

export default function Purchasing() {
  const [showCreatePO, setShowCreatePO] = useState(false);

  return (
    <AppLayout title="Pembelian">
      <div className="p-4 lg:p-6">
        {showCreatePO ? (
          <CreatePOForm onBack={() => setShowCreatePO(false)} />
        ) : (
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders" className="gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Purchase Orders
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="gap-1.5">
                <Store className="h-3.5 w-3.5" />
                Supplier
              </TabsTrigger>
            </TabsList>
            <TabsContent value="orders">
              <PurchaseOrderList onCreateNew={() => setShowCreatePO(true)} />
            </TabsContent>
            <TabsContent value="suppliers">
              <SupplierList />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}

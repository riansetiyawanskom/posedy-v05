import { useState } from "react";
import { ArrowLeft, Store, Package, Truck, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierList } from "@/components/purchasing/SupplierList";
import { PurchaseOrderList } from "@/components/purchasing/PurchaseOrderList";
import { CreatePOForm } from "@/components/purchasing/CreatePOForm";

export default function Purchasing() {
  const { user, signOut } = useAuth();
  const [showCreatePO, setShowCreatePO] = useState(false);

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
            <Truck className="h-4 w-4 text-accent-foreground" />
          </div>
          <h1 className="text-base font-extrabold tracking-tight text-card-foreground">
            Pembelian
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
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
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
      </main>
    </div>
  );
}

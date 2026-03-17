import { ArrowLeft, Package, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductTable } from "@/components/product-management/ProductTable";
import { CategoryTable } from "@/components/product-management/CategoryTable";

export default function ProductManagement() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
        <div className="flex items-center gap-2.5">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Package className="h-4 w-4 text-accent-foreground" />
          </div>
          <h1 className="text-base font-extrabold tracking-tight text-card-foreground">
            Manajemen Produk
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={signOut} title="Keluar">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
          </TabsList>
          <TabsContent value="products">
            <ProductTable />
          </TabsContent>
          <TabsContent value="categories">
            <CategoryTable />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

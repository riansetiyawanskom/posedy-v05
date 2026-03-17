import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductTable } from "@/components/product-management/ProductTable";
import { CategoryTable } from "@/components/product-management/CategoryTable";

export default function ProductManagement() {
  return (
    <AppLayout title="Manajemen Produk">
      <div className="p-4 lg:p-6">
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
      </div>
    </AppLayout>
  );
}

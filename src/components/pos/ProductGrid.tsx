import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { ProductCard } from "./ProductCard";
import { CategoryFilter } from "./CategoryFilter";
import type { Product } from "@/types/pos";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !selectedCategory || p.category_id === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Categories */}
      {!loadingCategories && categories && (
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Produk tidak ditemukan
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={onAddToCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

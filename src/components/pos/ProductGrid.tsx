import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Search, ScanBarcode } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { ProductCard } from "./ProductCard";
import { CategoryFilter } from "./CategoryFilter";
import type { Product } from "@/types/pos";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(true);

  // Barcode scanner buffer — scanners type fast then send Enter
  const scanBuffer = useRef("");
  const scanTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleScannerInput = useCallback(
    (e: KeyboardEvent) => {
      if (!scannerActive || !products) return;
      // Ignore modifier keys and focus on input fields
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "Enter" && scanBuffer.current.length >= 3) {
        e.preventDefault();
        const scanned = scanBuffer.current.trim();
        scanBuffer.current = "";

        const found = products.find(
          (p) => p.sku?.toLowerCase() === scanned.toLowerCase()
        );
        if (found) {
          if (found.stock > 0) {
            onAddToCart(found);
            toast.success(`🛒 ${found.name} ditambahkan`);
          } else {
            toast.error(`${found.name} — stok habis`);
          }
        } else {
          toast.error(`Produk dengan barcode "${scanned}" tidak ditemukan`);
        }
        // Clear search if scanner typed into it
        if (isInputFocused) setSearch("");
        return;
      }

      if (e.key.length === 1) {
        scanBuffer.current += e.key;
        clearTimeout(scanTimeout.current);
        scanTimeout.current = setTimeout(() => {
          scanBuffer.current = "";
        }, 100); // scanners complete within ~50-80ms
      }
    },
    [products, scannerActive, onAddToCart]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleScannerInput);
    return () => window.removeEventListener("keydown", handleScannerInput);
  }, [handleScannerInput]);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q);
      const matchCategory = !selectedCategory || p.category_id === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Search + scanner indicator */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari produk atau scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <button
          onClick={() => setScannerActive((v) => !v)}
          title={scannerActive ? "Scanner aktif" : "Scanner nonaktif"}
          className={`flex items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
            scannerActive
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          <ScanBarcode className="h-4 w-4" />
          <span className="hidden sm:inline">{scannerActive ? "Scanner ON" : "OFF"}</span>
        </button>
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

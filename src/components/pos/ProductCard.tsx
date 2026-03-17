import type { Product } from "@/types/pos";
import { Plus } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const outOfStock = product.stock <= 0;

  return (
    <button
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      className="group relative flex flex-col items-start rounded-lg border border-border bg-card p-4 text-left transition-all hover:pos-shadow hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50 animate-fade-in-up"
    >
      {/* Price badge */}
      <div className="absolute right-3 top-3 rounded-md bg-primary px-2.5 py-1 font-mono text-xs font-medium text-primary-foreground">
        {formatRupiah(product.price)}
      </div>

      {/* Product info */}
      <div className="mt-1 flex w-full flex-col gap-1">
        <h3 className="text-sm font-semibold text-card-foreground leading-tight pr-20">
          {product.name}
        </h3>
        {product.sku && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {product.sku}
          </span>
        )}
      </div>

      <div className="mt-3 flex w-full items-center justify-between">
        <span className={`text-xs font-medium ${outOfStock ? "text-destructive" : "text-muted-foreground"}`}>
          {outOfStock ? "Habis" : `Stok: ${product.stock}`}
        </span>
        {!outOfStock && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground opacity-0 transition-opacity group-hover:opacity-100">
            <Plus className="h-4 w-4" />
          </span>
        )}
      </div>
    </button>
  );
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

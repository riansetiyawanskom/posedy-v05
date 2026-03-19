import type { Product } from "@/types/pos";
import { Plus, Package } from "lucide-react";

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
      className="group relative flex flex-col items-start rounded-lg border border-border bg-card text-left transition-all hover:shadow-md hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50 animate-fade-in-up overflow-hidden"
    >
      {/* Product image — always shown */}
      <div className="w-full overflow-hidden aspect-[4/3] bg-muted/40">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Price badge */}
      <div className="absolute right-2 top-2 rounded-md bg-primary px-2 py-0.5 font-mono text-[11px] font-semibold text-primary-foreground shadow-sm">
        {formatRupiah(product.price)}
      </div>

      {/* Out of stock overlay */}
      {outOfStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
          <span className="rounded-md bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">
            Habis
          </span>
        </div>
      )}

      {/* Product info */}
      <div className="flex w-full flex-col gap-0.5 p-3 pt-2">
        <h3 className="text-sm font-semibold text-card-foreground leading-tight line-clamp-2">
          {product.name}
        </h3>
        {product.sku && (
          <span className="font-mono text-[10px] text-muted-foreground">
            {product.sku}
          </span>
        )}
        <div className="mt-1 flex w-full items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Stok: {product.stock}
          </span>
          {!outOfStock && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <Plus className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
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

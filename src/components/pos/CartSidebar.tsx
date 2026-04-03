import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Cart } from "@/types/pos";
import { formatRupiah } from "@/lib/format";

interface CartSidebarProps {
  cart: Cart;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function CartSidebar({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartSidebarProps) {
  const isEmpty = cart.items.length === 0;

  return (
    <div className="flex h-full flex-col bg-card rounded-xl border border-border pos-shadow">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-accent" />
          <h2 className="text-sm font-bold text-card-foreground">Keranjang</h2>
          {!isEmpty && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
              {cart.items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
        {!isEmpty && (
          <button
            onClick={onClearCart}
            className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
          >
            Hapus Semua
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ShoppingCart className="h-10 w-10 opacity-30" />
            <p className="text-sm">Keranjang kosong</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cart.items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 animate-fade-in-up"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-card-foreground truncate">
                    {item.product.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {formatRupiah(item.product.price)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.product.id, item.quantity - 1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-card-foreground transition-colors hover:bg-secondary"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-card-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.product.id, item.quantity + 1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-card-foreground transition-colors hover:bg-secondary"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-card-foreground">
                    {formatRupiah(item.product.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {!isEmpty && (
        <div className="border-t border-border px-5 py-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">{formatRupiah(cart.subtotal)}</span>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-xs text-pos-success">
              <span>Diskon</span>
              <span className="font-mono">-{formatRupiah(cart.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-card-foreground">
            <span>Total</span>
            <span className="font-mono">{formatRupiah(cart.total)}</span>
          </div>

          <Button
            variant="pos"
            size="lg"
            className="mt-3 w-full"
            onClick={onCheckout}
          >
            Bayar Sekarang
          </Button>
        </div>
      )}
    </div>
  );
}

import { useState, useCallback, useMemo } from "react";
import type { Product, CartItem, Cart } from "@/types/pos";



export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.min(quantity, i.product.stock) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
  }, []);

  const cart: Cart = useMemo(() => {
    const subtotal = items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    );
    const total = subtotal - discount;
    return { items, subtotal, tax: 0, discount, total: Math.max(total, 0) };
  }, [items, discount]);

  return { cart, addItem, removeItem, updateQuantity, clearCart, setDiscount };
}

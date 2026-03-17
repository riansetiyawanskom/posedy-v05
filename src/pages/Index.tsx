import { useState } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartSidebar } from "@/components/pos/CartSidebar";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

const Index = () => {
  const { cart, addItem, removeItem, updateQuantity, clearCart } = useCart();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const handlePaymentSuccess = () => {
    clearCart();
    setMobileCartOpen(false);
  };

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <AppLayout title="POS Kasir">
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>
        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ProductGrid onAddToCart={addItem} />
        </div>

        {/* Desktop cart sidebar */}
        <aside className="hidden w-[380px] shrink-0 p-3 lg:block">
          <CartSidebar
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            onCheckout={() => setPaymentOpen(true)}
          />
        </aside>

        {/* Mobile cart trigger */}
        <div className="fixed bottom-4 right-4 lg:hidden z-50">
          <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="relative rounded-full shadow-lg">
                <Menu className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                    {itemCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[360px] p-0 bg-background border-border">
              <CartSidebar
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onClearCart={clearCart}
                onCheckout={() => setPaymentOpen(true)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        cart={cart}
        onSuccess={handlePaymentSuccess}
      />
    </AppLayout>
  );
};

export default Index;

import { useState } from "react";
import { Link } from "react-router-dom";
import { Store, Menu, LogOut, Truck, ClipboardCheck, Users } from "lucide-react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartSidebar } from "@/components/pos/CartSidebar";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Index = () => {
  const { cart, addItem, removeItem, updateQuantity, clearCart } = useCart();
  const { user, signOut } = useAuth();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const handlePaymentSuccess = () => {
    clearCart();
    setMobileCartOpen(false);
  };

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Store className="h-4 w-4 text-accent-foreground" />
          </div>
          <h1 className="text-base font-extrabold tracking-tight text-card-foreground">
            POS System
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/purchasing">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Truck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pembelian</span>
            </Button>
          </Link>
          <Link to="/stock-opname">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Stok Opname</span>
            </Button>
          </Link>
          <Link to="/user-management">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">User</span>
            </Button>
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:block">
            {user?.email}
          </span>
          <Button variant="ghost" size="icon" onClick={signOut} title="Keluar">
            <LogOut className="h-4 w-4" />
          </Button>

          {/* Mobile cart trigger */}
        <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative lg:hidden">
              <Menu className="h-4 w-4" />
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
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Product grid */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ProductGrid onAddToCart={addItem} />
        </main>

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
      </div>

      {/* Payment modal */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        cart={cart}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Index;

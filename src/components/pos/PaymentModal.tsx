import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banknote, CreditCard, Wallet, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import type { Cart } from "@/types/pos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PaymentMethod = "cash" | "card" | "ewallet";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  cart: Cart;
  onSuccess: () => void;
}

const methods: { id: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "cash", label: "Tunai", icon: Banknote },
  { id: "card", label: "Kartu", icon: CreditCard },
  { id: "ewallet", label: "E-Wallet", icon: Wallet },
];

export function PaymentModal({ open, onClose, cart, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);

  const cashNum = Number(cashAmount) || 0;
  const change = cashNum - cart.total;
  const canPay = method !== "cash" || cashNum >= cart.total;

  const handlePay = async () => {
    if (!canPay) return;
    setLoading(true);

    try {
      // Generate order number
      const { data: orderNumData } = await supabase.rpc("generate_order_number");
      const orderNumber = orderNumData ?? `POS-${Date.now()}`;

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          subtotal: cart.subtotal,
          tax: cart.tax,
          discount: cart.discount,
          total: cart.total,
          payment_method: method,
          status: "completed",
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const items = cart.items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.product.price,
        subtotal: i.product.price * i.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(items);

      if (itemsError) throw itemsError;

      setSuccess(true);
      toast.success(`Pesanan ${orderNumber} berhasil!`);

      setTimeout(() => {
        setSuccess(false);
        setCashAmount("");
        setMethod("cash");
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      toast.error("Gagal memproses pembayaran: " + (err?.message ?? "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSuccess(false);
      setCashAmount("");
      setMethod("cash");
      onClose();
    }
  };

  const quickAmounts = [50000, 100000, 200000, 500000];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 animate-scale-in">
            <CheckCircle2 className="h-16 w-16 text-accent" />
            <p className="mt-4 text-lg font-bold text-card-foreground">
              Pembayaran Berhasil!
            </p>
            {method === "cash" && change > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Kembalian: <span className="font-mono font-bold text-accent">{formatRupiah(change)}</span>
              </p>
            )}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-card-foreground">Pembayaran</DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              {/* Total */}
              <div className="rounded-lg bg-primary px-5 py-4 text-center">
                <p className="text-xs font-medium text-primary-foreground/70">Total Pembayaran</p>
                <p className="mt-1 font-mono text-2xl font-extrabold text-primary-foreground">
                  {formatRupiah(cart.total)}
                </p>
              </div>

              {/* Payment method */}
              <div className="grid grid-cols-3 gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-xs font-semibold transition-all",
                      method === m.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-card text-muted-foreground hover:border-accent/30"
                    )}
                  >
                    <m.icon className="h-5 w-5" />
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Cash input */}
              {method === "cash" && (
                <div className="space-y-3 animate-fade-in-up">
                  <label className="text-xs font-medium text-muted-foreground">
                    Jumlah Uang Diterima
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="font-mono text-lg h-12 bg-card border-border"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCashAmount(String(amt))}
                        className="rounded-md bg-secondary px-2 py-2 font-mono text-xs font-medium text-secondary-foreground hover:bg-secondary/70 transition-colors"
                      >
                        {(amt / 1000)}K
                      </button>
                    ))}
                  </div>
                  {cashNum > 0 && (
                    <div className="flex justify-between rounded-lg bg-muted px-4 py-2.5">
                      <span className="text-xs text-muted-foreground">Kembalian</span>
                      <span
                        className={cn(
                          "font-mono text-sm font-bold",
                          change >= 0 ? "text-accent" : "text-destructive"
                        )}
                      >
                        {formatRupiah(Math.max(change, 0))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Pay button */}
              <Button
                variant="pos"
                size="lg"
                className="w-full"
                disabled={!canPay || loading}
                onClick={handlePay}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {loading ? "Memproses..." : "Konfirmasi Pembayaran"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { forwardRef } from "react";
import { formatRupiah } from "@/lib/format";
import type { Cart } from "@/types/pos";
import { useStoreSettings } from "@/hooks/useStoreSettings";

interface ReceiptData {
  orderNumber: string;
  date: string;
  cashierName: string;
  cart: Cart;
  paymentMethod: string;
  cashAmount?: number;
  change?: number;
}

export const ReceiptPrint = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  ({ data }, ref) => {
    const { settings } = useStoreSettings();
    const methodLabel =
      data.paymentMethod === "cash"
        ? "Tunai"
        : data.paymentMethod === "card"
        ? "Kartu"
        : "E-Wallet";

    const storeName = settings?.store_name || "POS System";
    const storeAddress = settings?.address || "";
    const storePhone = settings?.phone || "";

    return (
      <div
        ref={ref}
        className="receipt-thermal mx-auto bg-white text-black"
        style={{
          width: "302px",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "12px",
          lineHeight: "1.4",
          padding: "12px 8px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <p style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>
            {storeName}
          </p>
          {storeAddress && (
            <p style={{ fontSize: "10px", margin: "2px 0" }}>{storeAddress}</p>
          )}
          {storePhone && (
            <p style={{ fontSize: "10px", margin: "2px 0" }}>Telp: {storePhone}</p>
          )}
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

        {/* Order info */}
        <div style={{ fontSize: "11px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>No:</span>
            <span style={{ fontWeight: "bold" }}>{data.orderNumber}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Tanggal:</span>
            <span>{data.date}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Kasir:</span>
            <span>{data.cashierName}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

        {/* Items */}
        <div>
          {data.cart.items.map((item) => (
            <div key={item.product.id} style={{ marginBottom: "4px" }}>
              <p style={{ margin: 0, fontWeight: "bold", fontSize: "11px" }}>
                {item.product.name}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                }}
              >
                <span>
                  {item.quantity} x {formatRupiah(item.product.price)}
                </span>
                <span>{formatRupiah(item.product.price * item.quantity)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

        {/* Totals */}
        <div style={{ fontSize: "11px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>{formatRupiah(data.cart.subtotal)}</span>
          </div>
          {data.cart.discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Diskon</span>
              <span>-{formatRupiah(data.cart.discount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Pajak (10%)</span>
            <span>{formatRupiah(data.cart.tax)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "14px",
              marginTop: "4px",
            }}
          >
            <span>TOTAL</span>
            <span>{formatRupiah(data.cart.total)}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

        {/* Payment */}
        <div style={{ fontSize: "11px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Bayar ({methodLabel})</span>
            <span>
              {formatRupiah(
                data.paymentMethod === "cash"
                  ? data.cashAmount ?? data.cart.total
                  : data.cart.total
              )}
            </span>
          </div>
          {data.paymentMethod === "cash" &&
            (data.change ?? 0) > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                }}
              >
                <span>Kembalian</span>
                <span>{formatRupiah(data.change ?? 0)}</span>
              </div>
            )}
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: "10px" }}>
          <p style={{ margin: "2px 0" }}>Terima kasih atas kunjungan Anda!</p>
          <p style={{ margin: "2px 0" }}>Barang yang sudah dibeli</p>
          <p style={{ margin: "2px 0" }}>tidak dapat dikembalikan.</p>
        </div>
      </div>
    );
  }
);

ReceiptPrint.displayName = "ReceiptPrint";

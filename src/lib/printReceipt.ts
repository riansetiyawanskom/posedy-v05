export function printReceiptElement(element: HTMLElement) {
  const printWindow = window.open("", "_blank", "width=350,height=600");
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Struk Pembayaran</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body { margin: 0; padding: 0; background: #fff; }
  </style>
</head>
<body>
  ${element.innerHTML}
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
      setTimeout(function() { window.close(); }, 3000);
    };
  <\/script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

export interface ReceiptOrderData {
  orderNumber: string;
  date: string;
  paymentMethod: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
}

export function printOrderReceipt(data: ReceiptOrderData) {
  const methodLabel =
    data.paymentMethod === "cash" ? "Tunai" : data.paymentMethod === "card" ? "Kartu" : "E-Wallet";

  const itemsHtml = data.items
    .map(
      (item) => `
      <div style="margin-bottom:4px">
        <p style="margin:0;font-weight:bold;font-size:11px">${item.name}</p>
        <div style="display:flex;justify-content:space-between;font-size:11px">
          <span>${item.quantity} x ${fmtRp(item.unitPrice)}</span>
          <span>${fmtRp(item.subtotal)}</span>
        </div>
      </div>`
    )
    .join("");

  const discountRow =
    data.discount > 0
      ? `<div style="display:flex;justify-content:space-between"><span>Diskon</span><span>-${fmtRp(data.discount)}</span></div>`
      : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Struk - ${data.orderNumber}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body { margin:0; padding:0; background:#fff; font-family:'Courier New',Courier,monospace; font-size:12px; line-height:1.4; }
    .receipt { width:302px; margin:0 auto; padding:12px 8px; color:#000; }
    .sep { border-top:1px dashed #000; margin:6px 0; }
    .row { display:flex; justify-content:space-between; font-size:11px; }
    .center { text-align:center; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center" style="margin-bottom:8px">
      <p style="font-size:16px;font-weight:bold;margin:0">${data.storeName || "POS SYSTEM"}</p>
      ${data.storeAddress ? `<p style="font-size:10px;margin:2px 0">${data.storeAddress}</p>` : ""}
      ${data.storePhone ? `<p style="font-size:10px;margin:2px 0">Telp: ${data.storePhone}</p>` : ""}
    </div>
    <div class="sep"></div>
    <div style="font-size:11px">
      <div class="row"><span>No:</span><span style="font-weight:bold">${data.orderNumber}</span></div>
      <div class="row"><span>Tanggal:</span><span>${data.date}</span></div>
      <div class="row"><span>Metode:</span><span>${methodLabel}</span></div>
    </div>
    <div class="sep"></div>
    ${itemsHtml}
    <div class="sep"></div>
    <div style="font-size:11px">
      <div class="row"><span>Subtotal</span><span>${fmtRp(data.subtotal)}</span></div>
      ${discountRow}
      <div class="row"><span>Pajak</span><span>${fmtRp(data.tax)}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px;margin-top:4px">
        <span>TOTAL</span><span>${fmtRp(data.total)}</span>
      </div>
    </div>
    <div class="sep"></div>
    <div class="center" style="font-size:10px">
      <p style="margin:2px 0">Terima kasih atas kunjungan Anda!</p>
      <p style="margin:2px 0">Barang yang sudah dibeli</p>
      <p style="margin:2px 0">tidak dapat dikembalikan.</p>
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
      setTimeout(function() { window.close(); }, 3000);
    };
  <\/script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=350,height=600");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function fmtRp(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

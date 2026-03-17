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

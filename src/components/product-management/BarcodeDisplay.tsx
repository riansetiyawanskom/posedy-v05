import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  className?: string;
}

export function BarcodeDisplay({ value, width = 1.5, height = 40, fontSize = 12, className }: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width,
          height,
          fontSize,
          margin: 4,
          displayValue: true,
          textMargin: 2,
        });
      } catch {
        // invalid barcode value — ignore
      }
    }
  }, [value, width, height, fontSize]);

  if (!value) return null;

  return <svg ref={svgRef} className={className} />;
}

export function printBarcode(sku: string, productName: string) {
  const win = window.open("", "_blank", "width=400,height=300");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html><head><title>Barcode - ${sku}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"><\/script>
<style>
  body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: monospace; }
  .name { font-size: 11px; margin-bottom: 4px; text-align: center; max-width: 200px; }
  @media print { body { margin: 0; } }
</style></head><body>
<div class="name">${productName}</div>
<svg id="bc"></svg>
<script>
  JsBarcode("#bc", "${sku}", { format: "CODE128", width: 2, height: 50, fontSize: 14, margin: 6, displayValue: true });
  setTimeout(() => { window.print(); window.close(); }, 400);
<\/script>
</body></html>`);
  win.document.close();
}

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Printer, X, Download } from "lucide-react";
import { ReceiptPrint } from "./ReceiptPrint";
import { printReceiptElement, type ThermalPaperSize } from "@/lib/printReceipt";
import type { Cart } from "@/types/pos";

export interface ReceiptPreviewData {
  orderNumber: string;
  date: string;
  cashierName?: string;
  cart: Cart;
  paymentMethod: string;
  cashAmount?: number;
  change?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: ReceiptPreviewData | null;
}

const GAP_OPTIONS = [
  { value: "6", label: "Rapat (6mm)" },
  { value: "12", label: "Sedang (12mm)" },
  { value: "20", label: "Lega (20mm)" },
  { value: "30", label: "Sangat Lega (30mm)" },
];

export function ReceiptPreviewDialog({ open, onClose, data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [paperSize, setPaperSize] = useState<ThermalPaperSize>("80mm");
  const [gapMm, setGapMm] = useState<string>("12");

  const handlePrint = () => {
    if (ref.current)
      printReceiptElement(ref.current, {
        paperSize,
        bottomGapMm: Number(gapMm),
      });
  };

  const handleDownload = () => {
    if (!ref.current || !data) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Struk ${data.orderNumber}</title><style>@page{size:${paperSize} auto;margin:0}body{margin:0;padding:0;background:#fff;font-family:'Courier New',monospace}.gap{height:${gapMm}mm}</style></head><body>${ref.current.innerHTML}<div class="gap"></div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `struk-${data.orderNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-card-foreground">
            <Printer className="h-4 w-4 text-accent" />
            Preview Struk
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pilih ukuran kertas & jarak antar struk sebelum mencetak.
          </DialogDescription>
        </DialogHeader>

        {/* Print options */}
        <div className="grid grid-cols-2 gap-3 border-b border-border bg-muted/20 px-5 py-3">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">
              Ukuran Kertas
            </Label>
            <Select value={paperSize} onValueChange={(v) => setPaperSize(v as ThermalPaperSize)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58mm">Thermal 58mm</SelectItem>
                <SelectItem value="80mm">Thermal 80mm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">
              Jarak Antar Struk
            </Label>
            <Select value={gapMm} onValueChange={setGapMm}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GAP_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {data && (
          <div className="max-h-[50vh] overflow-y-auto bg-muted/30 px-4 py-4">
            <div className="rounded-md border border-border bg-white shadow-sm">
              <ReceiptPrint
                ref={ref}
                data={data as any}
                paperSize={paperSize}
                bottomGapMm={Number(gapMm)}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-card px-5 py-3 sm:flex-row sm:justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> Tutup
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Simpan
            </Button>
            <Button variant="pos" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Cetak Sekarang
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

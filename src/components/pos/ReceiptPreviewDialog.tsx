import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, Download } from "lucide-react";
import { ReceiptPrint } from "./ReceiptPrint";
import { printReceiptElement } from "@/lib/printReceipt";
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

export function ReceiptPreviewDialog({ open, onClose, data }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (ref.current) printReceiptElement(ref.current);
  };

  const handleDownload = () => {
    if (!ref.current || !data) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Struk ${data.orderNumber}</title><style>@page{size:80mm auto;margin:0}body{margin:0;padding:0;background:#fff;font-family:'Courier New',monospace}</style></head><body>${ref.current.innerHTML}</body></html>`;
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
            Tinjau struk sebelum mencetak. Pastikan detail sudah benar.
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="max-h-[55vh] overflow-y-auto bg-muted/30 px-4 py-4">
            <div className="rounded-md border border-border bg-white shadow-sm">
              <ReceiptPrint ref={ref} data={data as any} />
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

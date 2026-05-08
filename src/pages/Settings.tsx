import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, Store, AlertTriangle, Trash2, Percent } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyMessage";
import { useQueryClient } from "@tanstack/react-query";

type Scope = "products" | "purchasing" | "history" | "stock_opname";

const SCOPE_OPTIONS: { id: Scope; label: string; description: string }[] = [
  { id: "history", label: "Riwayat Transaksi", description: "Hapus semua pesanan & item penjualan." },
  { id: "stock_opname", label: "Stok Opname", description: "Hapus sesi opname & penyesuaian stok." },
  { id: "purchasing", label: "Pembelian", description: "Hapus semua PO & item pembelian." },
  { id: "products", label: "Produk", description: "Hapus produk (otomatis dinonaktifkan jika masih dipakai)." },
];

export default function Settings() {
  const { settings, isLoading, updateSettings, isUpdating } = useStoreSettings();
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selected, setSelected] = useState<Set<Scope>>(new Set());
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name);
      setPhone(settings.phone ?? "");
      setAddress(settings.address ?? "");
    }
  }, [settings]);

  const toggleScope = (s: Scope, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(s); else next.delete(s);
      return next;
    });
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-transaction-data", {
        body: { scopes: Array.from(selected) },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("✓ Data berhasil direset");
      setSelected(new Set());
      setConfirmText("");
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setResetting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Pengaturan">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const canReset = selected.size > 0 && confirmText.trim().toUpperCase() === "RESET";

  return (
    <AppLayout title="Pengaturan">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">Kelola profil toko yang tampil di aplikasi dan struk.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Profil Toko
            </CardTitle>
            <CardDescription>
              Nama toko akan ditampilkan di aplikasi POS dan struk. Nomor HP/WA dan alamat hanya ditampilkan di struk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Nama Toko</Label>
              <Input id="store-name" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Masukkan nama toko" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">No. HP / WhatsApp</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contoh: 0812-3456-7890" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Masukkan alamat toko" rows={3} />
            </div>
            <Button onClick={() => updateSettings({ store_name: storeName, phone, address })} disabled={isUpdating} className="gap-2">
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Pengaturan
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reset Data
            </CardTitle>
            <CardDescription>
              Hapus permanen data sesuai kategori yang dipilih. Tindakan ini <strong>tidak dapat dibatalkan</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {SCOPE_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex items-start gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-accent/30 transition">
                  <Checkbox
                    checked={selected.has(opt.id)}
                    onCheckedChange={(c) => toggleScope(opt.id, c === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={selected.size === 0} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Reset Data Terpilih
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Yakin ingin mereset data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Anda akan menghapus permanen: <strong>{Array.from(selected).map((s) => SCOPE_OPTIONS.find((o) => o.id === s)?.label).join(", ")}</strong>.
                    Ketik <strong>RESET</strong> untuk mengonfirmasi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Ketik RESET"
                  autoFocus
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={!canReset || resetting}
                    onClick={(e) => { e.preventDefault(); if (canReset) handleReset(); }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Reset"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

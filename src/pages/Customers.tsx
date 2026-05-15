import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useCustomers, useCustomerOrders, type Customer } from "@/hooks/useCustomers";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Search, Users, History } from "lucide-react";
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyMessage";
import { formatRupiah } from "@/lib/format";

const methodLabel: Record<string, string> = {
  cash: "Tunai",
  card: "Kartu",
  ewallet: "E-Wallet",
};

export default function Customers() {
  const { data: customers, isLoading } = useCustomers();
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission("module:users"); // admin proxy; only admin has users module
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [history, setHistory] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers ?? [];
    return (customers ?? []).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setName(c.name);
    setPhone(c.phone ?? "");
    setEmail(c.email ?? "");
    setAddress(c.address ?? "");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("customers").update(payload).eq("id", editing.id)
      : await supabase.from("customers").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(friendlyError(error, editing ? "Pelanggan belum bisa diperbarui." : "Pelanggan belum bisa ditambahkan."));
    } else {
      toast.success(editing ? "Pelanggan diperbarui ✓" : "Pelanggan baru ditambahkan ✓");
      qc.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    const { error } = await supabase.from("customers").delete().eq("id", deleting.id);
    setRemoving(false);
    if (error) {
      toast.error(friendlyError(error, "Pelanggan belum bisa dihapus."));
    } else {
      toast.success("Pelanggan dihapus ✓");
      qc.invalidateQueries({ queryKey: ["customers"] });
      setDeleting(null);
    }
  };

  return (
    <AppLayout title="Pelanggan">
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama / telepon / email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="pos" size="sm" className="gap-1.5" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5" /> Tambah Pelanggan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">
                  {editing ? "Edit Pelanggan" : "Tambah Pelanggan"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-2.5 sm:grid-cols-2">
                <Input placeholder="Nama Pelanggan *" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="bg-card border-border" />
                <Input placeholder="Telepon" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} className="bg-card border-border" />
                <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} className="bg-card border-border sm:col-span-2" />
                <Textarea placeholder="Alamat" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} className="bg-card border-border sm:col-span-2" rows={2} />
                <Button variant="pos" className="w-full sm:col-span-2" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <Users className="h-4 w-4 text-accent" /> Daftar Pelanggan
              <Badge variant="secondary" className="ml-auto text-xs">{filtered.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Belum ada pelanggan</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden sm:table-cell">Telepon</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden lg:table-cell">Alamat</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-card-foreground">{c.name}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.phone ?? "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.email ?? "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell truncate max-w-xs">{c.address ?? "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHistory(c)} title="Riwayat Pesanan">
                              <History className="h-3.5 w-3.5" />
                            </Button>
                            {isAdmin && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="Edit">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleting(c)} title="Hapus">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pelanggan <span className="font-semibold">{deleting?.name}</span> akan dihapus permanen. Riwayat pesanan tetap tersimpan tetapi tidak lagi terhubung ke pelanggan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={removing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CustomerHistoryDialog customer={history} onClose={() => setHistory(null)} />
    </AppLayout>
  );
}

function CustomerHistoryDialog({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const { data: orders, isLoading } = useCustomerOrders(customer?.id ?? null);
  const total = (orders ?? []).reduce((s, o: any) => s + Number(o.total), 0);

  return (
    <Dialog open={!!customer} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Riwayat Pesanan — {customer?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{orders?.length ?? 0} transaksi</span>
            <span>Total: <span className="font-mono font-semibold text-card-foreground">{formatRupiah(total)}</span></span>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !orders?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada transaksi</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">No. Order</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Tanggal</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Metode</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: any) => (
                    <tr key={o.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">{o.order_number}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(o.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{methodLabel[o.payment_method] ?? o.payment_method}</Badge></td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{formatRupiah(Number(o.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

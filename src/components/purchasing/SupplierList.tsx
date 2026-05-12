import { useState } from "react";
import { useSuppliers } from "@/hooks/usePurchasing";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyMessage";
import type { Supplier } from "@/types/purchasing";

export function SupplierList() {
  const { data: suppliers, isLoading } = useSuppliers();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const qc = useQueryClient();

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setContactPerson("");
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setName(s.name);
    setPhone(s.phone ?? "");
    setEmail(s.email ?? "");
    setContactPerson(s.contact_person ?? "");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name,
      phone: phone || null,
      email: email || null,
      contact_person: contactPerson || null,
    };
    const { error } = editing
      ? await supabase.from("suppliers").update(payload).eq("id", editing.id)
      : await supabase.from("suppliers").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(friendlyError(error, editing ? "Supplier belum bisa diperbarui." : "Supplier belum bisa ditambahkan."));
    } else {
      toast.success(editing ? "Supplier diperbarui ✓" : "Supplier baru ditambahkan ✓");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setOpen(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    const { error } = await supabase.from("suppliers").delete().eq("id", deleting.id);
    setRemoving(false);
    if (error) {
      toast.error(friendlyError(error, "Supplier belum bisa dihapus."));
    } else {
      toast.success("Supplier dihapus ✓");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Daftar Supplier</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="pos" size="sm" className="gap-1.5" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" />
              Tambah Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">
                {editing ? "Edit Supplier" : "Tambah Supplier"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-2.5 grid sm:grid-cols-2 gap-2.5">
              <Input placeholder="Nama Supplier *" value={name} onChange={(e) => setName(e.target.value)} required className="bg-card border-border" />
              <Input placeholder="Contact Person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="bg-card border-border" />
              <Input placeholder="Telepon" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-card border-border" />
              <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-card border-border" />
              <Button variant="pos" className="w-full sm:col-span-2" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card pos-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden sm:table-cell">Kontak</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Telepon</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden lg:table-cell">Email</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!suppliers?.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Belum ada supplier
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-card-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.contact_person ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{s.email ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)} aria-label="Edit supplier">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleting(s)} aria-label="Hapus supplier">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Supplier <span className="font-semibold">{deleting?.name}</span> akan dihapus permanen. Aksi ini tidak dapat dibatalkan.
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
    </div>
  );
}

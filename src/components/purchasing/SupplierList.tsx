import { useState } from "react";
import { useSuppliers } from "@/hooks/usePurchasing";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function SupplierList() {
  const { data: suppliers, isLoading } = useSuppliers();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("suppliers").insert({
      name,
      phone: phone || null,
      email: email || null,
      contact_person: contactPerson || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Supplier berhasil ditambahkan");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      setContactPerson("");
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="pos" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Tambah Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">Tambah Supplier</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-2.5 grid sm:grid-cols-2 gap-2.5">
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
            </tr>
          </thead>
          <tbody>
            {!suppliers?.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useAllCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type CategoryFormData } from "@/hooks/useProductManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function CategoryTable() {
  const { data: categories, isLoading } = useAllCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>({ name: "", icon: "", sort_order: 0 });

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: "", icon: "", sort_order: 0 });
    setFormOpen(true);
  };

  const openEdit = (c: any) => {
    setEditCat(c);
    setForm({ name: c.name, icon: c.icon ?? "", sort_order: c.sort_order ?? 0 });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editCat) {
      updateCategory.mutate({ id: editCat.id, ...form }, { onSuccess: () => setFormOpen(false) });
    } else {
      createCategory.mutate(form, { onSuccess: () => setFormOpen(false) });
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{(categories ?? []).length} kategori</p>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Memuat kategori...</p>
      ) : (categories ?? []).length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Belum ada kategori</p>
      ) : (
        <div className="rounded-lg border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead className="text-right">Urutan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(categories ?? []).map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-card-foreground">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.icon ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono">{c.sort_order ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editCat ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nama Kategori *</Label>
              <Input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-icon">Icon (emoji / text)</Label>
              <Input id="cat-icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-order">Urutan</Label>
              <Input id="cat-order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : editCat ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk dalam kategori ini akan kehilangan kategorinya. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteCategory.mutate(deleteId); setDeleteId(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

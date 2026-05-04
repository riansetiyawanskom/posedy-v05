import { useState } from "react";
import { Shield, ShieldCheck, UserCircle, Plus, X, KeyRound, Trash2, UserPlus, MoreVertical, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserManagement, type Role } from "@/hooks/useUserManagement";
import { useAuth } from "@/hooks/useAuth";

export function UserList() {
  const {
    profiles,
    roles,
    userRoles,
    isLoading,
    assignRole,
    removeRole,
    createUser,
    deleteUser,
    resetUserPassword,
    setUserPassword,
  } = useUserManagement();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const [assignDialog, setAssignDialog] = useState({ open: false, userId: "", email: "" });
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", role_id: "" });

  const [pwDialog, setPwDialog] = useState({ open: false, userId: "", email: "" });
  const [newPassword, setNewPassword] = useState("");

  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: "", email: "" });

  const getUserRoles = (userId: string): Role[] => {
    const ids = userRoles.filter((ur) => ur.user_id === userId).map((ur) => ur.role_id);
    return roles.filter((r) => ids.includes(r.id));
  };

  const getAvailableRoles = (userId: string): Role[] => {
    const ids = userRoles.filter((ur) => ur.user_id === userId).map((ur) => ur.role_id);
    return roles.filter((r) => !ids.includes(r.id));
  };

  const filtered = profiles.filter((p) => {
    const matchSearch =
      !search ||
      (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.full_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole =
      filterRole === "all" || getUserRoles(p.id).some((r) => r.id === filterRole);
    return matchSearch && matchRole;
  });

  const adminCount = profiles.filter((p) => getUserRoles(p.id).some((r) => r.name === "admin")).length;
  const kasirCount = profiles.filter((p) => getUserRoles(p.id).some((r) => r.name === "kasir")).length;

  const handleAssign = () => {
    if (!selectedRoleId || !assignDialog.userId) return;
    assignRole.mutate({ userId: assignDialog.userId, roleId: selectedRoleId });
    setAssignDialog({ open: false, userId: "", email: "" });
    setSelectedRoleId("");
  };

  const handleRemoveRole = (userId: string, roleId: string) => {
    if (userId === user?.id) {
      const role = roles.find((r) => r.id === roleId);
      if (role?.name === "admin") return;
    }
    removeRole.mutate({ userId, roleId });
  };

  const handleCreate = () => {
    if (!newUser.email || !newUser.password) return;
    createUser.mutate(
      {
        email: newUser.email.trim(),
        password: newUser.password,
        full_name: newUser.full_name.trim(),
        role_id: newUser.role_id || undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setNewUser({ email: "", password: "", full_name: "", role_id: "" });
        },
      }
    );
  };

  const handleSetPassword = () => {
    if (!newPassword || newPassword.length < 6 || !pwDialog.userId) return;
    setUserPassword.mutate(
      { user_id: pwDialog.userId, password: newPassword },
      {
        onSuccess: () => {
          setPwDialog({ open: false, userId: "", email: "" });
          setNewPassword("");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Memuat data user...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total User</p>
            <p className="text-2xl font-bold text-card-foreground">{profiles.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Admin</p>
            <p className="text-2xl font-bold text-card-foreground">{adminCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Kasir</p>
            <p className="text-2xl font-bold text-card-foreground">{kasirCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Shield className="h-5 w-5 text-accent" />
              Manajemen User & Role
            </CardTitle>
            <CardDescription>Kelola akun user, role, dan kata sandi.</CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Tambah User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    Tidak ada user yang cocok.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((profile) => {
                const assignedRoles = getUserRoles(profile.id);
                const isCurrentUser = profile.id === user?.id;

                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-card-foreground">{profile.full_name || "—"}</span>
                        {isCurrentUser && <Badge variant="outline" className="text-[10px]">Anda</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{profile.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {assignedRoles.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">Belum ada role</span>
                        )}
                        {assignedRoles.map((role) => (
                          <Badge
                            key={role.id}
                            variant={role.name === "admin" ? "default" : "secondary"}
                            className="gap-1 pr-1"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            {role.name}
                            {!(isCurrentUser && role.name === "admin") && (
                              <button
                                onClick={() => handleRemoveRole(profile.id, role.id)}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-primary-foreground/20"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          disabled={getAvailableRoles(profile.id).length === 0}
                          onClick={() => setAssignDialog({ open: true, userId: profile.id, email: profile.email ?? "" })}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Role
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPwDialog({ open: true, userId: profile.id, email: profile.email ?? "" })}>
                              <KeyRound className="h-4 w-4 mr-2" />
                              Ganti Kata Sandi
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!profile.email}
                              onClick={() => profile.email && resetUserPassword.mutate(profile.email)}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Kirim Tautan Reset
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={isCurrentUser}
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteDialog({ open: true, userId: profile.id, email: profile.email ?? "" })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(o) => !o && setAssignDialog({ open: false, userId: "", email: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Role</DialogTitle>
            <DialogDescription>Tambahkan role untuk <strong>{assignDialog.email}</strong></DialogDescription>
          </DialogHeader>
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger><SelectValue placeholder="Pilih role..." /></SelectTrigger>
            <SelectContent>
              {getAvailableRoles(assignDialog.userId).map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name} {role.description && `— ${role.description}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog({ open: false, userId: "", email: "" })}>Batal</Button>
            <Button onClick={handleAssign} disabled={!selectedRoleId || assignRole.isPending}>
              {assignRole.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>Buat akun user baru. Email langsung aktif tanpa perlu verifikasi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cu-name">Nama Lengkap</Label>
              <Input id="cu-name" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-email">Email</Label>
              <Input id="cu-email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-pw">Kata Sandi</Label>
              <Input id="cu-pw" type="password" minLength={6} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              <p className="text-[11px] text-muted-foreground">Minimal 6 karakter.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Role Awal</Label>
              <Select value={newUser.role_id} onValueChange={(v) => setNewUser({ ...newUser, role_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih role (opsional)" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={!newUser.email || newUser.password.length < 6 || createUser.isPending}>
              {createUser.isPending ? "Membuat..." : "Buat User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={pwDialog.open} onOpenChange={(o) => !o && setPwDialog({ open: false, userId: "", email: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Kata Sandi</DialogTitle>
            <DialogDescription>Atur kata sandi baru untuk <strong>{pwDialog.email}</strong>.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="set-pw">Kata Sandi Baru</Label>
            <Input id="set-pw" type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Minimal 6 karakter. User dapat langsung login dengan kata sandi ini.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPwDialog({ open: false, userId: "", email: "" }); setNewPassword(""); }}>Batal</Button>
            <Button onClick={handleSetPassword} disabled={newPassword.length < 6 || setUserPassword.isPending}>
              {setUserPassword.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(o) => !o && setDeleteDialog({ open: false, userId: "", email: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus user ini?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteDialog.email}</strong> akan dihapus permanen beserta semua role-nya. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteUser.mutate(deleteDialog.userId, {
                  onSuccess: () => setDeleteDialog({ open: false, userId: "", email: "" }),
                });
              }}
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

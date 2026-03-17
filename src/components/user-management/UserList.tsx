import { useState } from "react";
import { Shield, ShieldCheck, UserCircle, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useUserManagement, type Profile, type Role } from "@/hooks/useUserManagement";
import { useAuth } from "@/hooks/useAuth";

export function UserList() {
  const { profiles, roles, userRoles, isLoading, assignRole, removeRole } = useUserManagement();
  const { user } = useAuth();
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; userId: string; email: string }>({
    open: false,
    userId: "",
    email: "",
  });
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const getUserRoles = (userId: string): Role[] => {
    const roleIds = userRoles.filter((ur) => ur.user_id === userId).map((ur) => ur.role_id);
    return roles.filter((r) => roleIds.includes(r.id));
  };

  const getAvailableRoles = (userId: string): Role[] => {
    const assignedIds = userRoles.filter((ur) => ur.user_id === userId).map((ur) => ur.role_id);
    return roles.filter((r) => !assignedIds.includes(r.id));
  };

  const handleAssign = () => {
    if (!selectedRoleId || !assignDialog.userId) return;
    assignRole.mutate({ userId: assignDialog.userId, roleId: selectedRoleId });
    setAssignDialog({ open: false, userId: "", email: "" });
    setSelectedRoleId("");
  };

  const handleRemoveRole = (userId: string, roleId: string) => {
    if (userId === user?.id) {
      // Prevent removing own admin role
      const role = roles.find((r) => r.id === roleId);
      if (role?.name === "admin") return;
    }
    removeRole.mutate({ userId, roleId });
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
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Shield className="h-5 w-5 text-accent" />
            Manajemen User & Role
          </CardTitle>
          <CardDescription>
            Kelola role akses untuk setiap user. Total: {profiles.length} user
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {profiles.map((profile) => {
                const assignedRoles = getUserRoles(profile.id);
                const isCurrentUser = profile.id === user?.id;

                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-card-foreground">
                          {profile.full_name || "—"}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-[10px]">
                            Anda
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {profile.email}
                    </TableCell>
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={getAvailableRoles(profile.id).length === 0}
                        onClick={() =>
                          setAssignDialog({
                            open: true,
                            userId: profile.id,
                            email: profile.email ?? "",
                          })
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Role
                      </Button>
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
            <DialogDescription>
              Tambahkan role untuk <strong>{assignDialog.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih role..." />
            </SelectTrigger>
            <SelectContent>
              {getAvailableRoles(assignDialog.userId).map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name} {role.description && `— ${role.description}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog({ open: false, userId: "", email: "" })}>
              Batal
            </Button>
            <Button onClick={handleAssign} disabled={!selectedRoleId || assignRole.isPending}>
              {assignRole.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

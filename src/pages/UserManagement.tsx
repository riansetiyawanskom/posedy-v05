import { AppLayout } from "@/components/AppLayout";
import { UserList } from "@/components/user-management/UserList";

export default function UserManagement() {
  return (
    <AppLayout title="Manajemen User">
      <div className="p-4 lg:p-6">
        <UserList />
      </div>
    </AppLayout>
  );
}

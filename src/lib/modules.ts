import {
  Store,
  LayoutDashboard,
  Truck,
  ClipboardCheck,
  Users,
  Package,
  History,
  FileText,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

/**
 * UI metadata for each module. Access control is NOT defined here —
 * it is driven by the `permissions` + `role_permissions` tables in the DB.
 * Each entry only declares which permission slug is required to see/use it.
 */
export interface ModuleDef {
  title: string;
  url: string;
  icon: LucideIcon;
  permission: string; // permission slug from public.permissions
}

export const MODULES: ModuleDef[] = [
  { title: "POS Kasir", url: "/", icon: Store, permission: "module:pos" },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: "module:dashboard" },
  { title: "Produk", url: "/product-management", icon: Package, permission: "module:products" },
  { title: "Pembelian", url: "/purchasing", icon: Truck, permission: "module:purchasing" },
  { title: "Stok Opname", url: "/stock-opname", icon: ClipboardCheck, permission: "module:stock_opname" },
  { title: "Riwayat", url: "/transactions", icon: History, permission: "module:transactions" },
  { title: "Laporan", url: "/reports", icon: FileText, permission: "module:reports" },
  { title: "User", url: "/user-management", icon: Users, permission: "module:users" },
  { title: "Log Aktivitas", url: "/activity-logs", icon: ScrollText, permission: "module:activity_logs" },
  { title: "Pengaturan", url: "/settings", icon: Settings, permission: "module:settings" },
];

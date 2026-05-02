import { Store, LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { usePermissions } from "@/hooks/usePermissions";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { MODULES } from "@/lib/modules";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { roles } = useUserRole();
  const { hasPermission } = usePermissions();
  const { settings } = useStoreSettings();

  // Menu items are filtered by DB-driven permissions (not hardcoded roles).
  const navItems = MODULES.filter((m) => hasPermission(m.permission));

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        {/* Brand */}
        <div className={`flex items-center gap-2.5 px-4 py-4 ${collapsed ? "justify-center px-2" : ""}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
            <Store className="h-4 w-4 text-accent-foreground" />
          </div>
          {!collapsed && (
            <span className="text-sm font-extrabold tracking-tight text-card-foreground">
              {settings?.store_name || "POS System"}
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/"
                        ? location.pathname === "/"
                        : location.pathname.startsWith(item.url)
                    }
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        {!collapsed && (
          <div className="mb-2 space-y-1">
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            <div className="flex gap-1">
              {roles.map((r) => (
                <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={signOut}
          className={collapsed ? "" : "w-full justify-start gap-2"}
          title="Keluar"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Keluar</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

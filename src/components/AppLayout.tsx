import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface Props {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: Props) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
            <SidebarTrigger />
            <h1 className="text-base font-extrabold tracking-tight text-card-foreground">
              {title}
            </h1>
          </header>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

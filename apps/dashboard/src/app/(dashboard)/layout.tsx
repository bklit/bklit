import { SidebarInset, SidebarProvider } from "@bklit/ui/components/sidebar";
import { SiteHeader } from "@/components/header/site-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { WorkspaceProvider } from "@/contexts/workspace-provider";
import { authenticated } from "@/lib/auth";
import { api } from "@/trpc/server";

export default async function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const session = await authenticated();
  const organizations = await api.organization.list();

  return (
    <WorkspaceProvider session={session} organizations={organizations}>
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 pt-(--header-height)">
          <AppSidebar />

          <SidebarInset>
            <main className="flex flex-col dark:bg-bklit-800 bg-zinc-50 border border-border rounded-xl overflow-auto h-0 min-h-full p-8 relative">
              {children}
            </main>
            {modal}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}

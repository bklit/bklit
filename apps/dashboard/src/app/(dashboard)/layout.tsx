import { SidebarInset, SidebarProvider } from "@bklit/ui/components/sidebar";
import { InvitationHandler } from "@/components/invitation-handler";
import { SiteHeader } from "@/components/header/site-header";
import { DemoProjectModal } from "@/components/modals/demo-project-modal";
import { WelcomeModal } from "@/components/modals/welcome-modal";
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
            <main className="flex flex-col bg-background dark:sm:bg-bklit-800 sm:bg-zinc-50 sm:border border-border rounded-xl sm:overflow-auto sm:h-0 sm:min-h-full relative pb-4 sm:p-8">
              {children}
            </main>
            {modal}
          </SidebarInset>
        </div>
      </SidebarProvider>
      <InvitationHandler />
      <WelcomeModal />
      <DemoProjectModal />
    </WorkspaceProvider>
  );
}

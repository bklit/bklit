import { SidebarInset, SidebarProvider } from "@bklit/ui/components/sidebar";
import { SiteHeader } from "@/components/header/site-header";
import { InvitationHandler } from "@/components/invitation-handler";
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
    <WorkspaceProvider organizations={organizations} session={session}>
      <SidebarProvider className="flex flex-col sm:overflow-hidden">
        <SiteHeader />
        <div className="flex flex-1 pt-(--header-height)">
          <AppSidebar />

          <SidebarInset>
            <main className="relative flex flex-col rounded-xl border-border bg-background pb-4 sm:h-0 sm:min-h-full sm:overflow-auto sm:border sm:bg-zinc-50 sm:p-8 dark:sm:bg-bklit-800">
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

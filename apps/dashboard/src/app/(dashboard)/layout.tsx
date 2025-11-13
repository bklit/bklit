import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/header/site-header";
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
      <div className="flex flex-col min-h-screen ">
        <SiteHeader />
        <main className="flex-1 flex flex-col bg-background">{children}</main>
        <Footer />
        {modal}
      </div>
    </WorkspaceProvider>
  );
}

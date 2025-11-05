import { PageHeader } from "@/components/header/page-header";
import { SettingsNavigation } from "@/components/nav/settings-navigation";
import { HydrateClient } from "@/trpc/server";

interface SettingsLayoutProps {
  title: string;
  description: string;
  headerActions?: React.ReactNode;
  navigationType: "organizationSettings" | "projectSettings";
  organizationId: string;
  projectId?: string;
  children: React.ReactNode;
}

export function SettingsLayout({
  title,
  description,
  headerActions,
  navigationType,
  organizationId,
  projectId,
  children,
}: SettingsLayoutProps) {
  return (
    <HydrateClient>
      <PageHeader title={title} description={description}>
        {headerActions}
      </PageHeader>
      <div className="container mx-auto py-6 px-4 flex gap-4">
        <div className="w-1/6">
          <SettingsNavigation
            type={navigationType}
            organizationId={organizationId}
            projectId={projectId}
          />
        </div>
        <div className="w-5/6">{children}</div>
      </div>
    </HydrateClient>
  );
}


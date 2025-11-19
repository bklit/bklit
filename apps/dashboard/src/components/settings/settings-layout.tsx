import { PageHeader } from "@/components/header/page-header";
import { HydrateClient } from "@/trpc/server";
import { SettingsNavigation } from "./settings-navigation";

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
      <div className="container mx-auto flex gap-4">
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

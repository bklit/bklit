import { PageHeader } from "@/components/header/page-header";
import { SubNavigation } from "@/components/navigation/sub-navigation";
import { ProjectNotifications } from "@/components/project/notifications";

interface NotificationSettingsPageProps {
  params: Promise<{ organizationId: string; projectId: string }>;
}

export default async function NotificationSettingsPage({
  params,
}: NotificationSettingsPageProps) {
  const { organizationId, projectId } = await params;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Manage your notification preferences for this project."
      >
        <SubNavigation
          configKey="projectSettings"
          organizationId={organizationId}
          projectId={projectId}
        />
      </PageHeader>
      <ProjectNotifications
        projectId={projectId}
        organizationId={organizationId}
      />
    </>
  );
}

import { SettingsLayout } from "@/components/settings/settings-layout";
import { ProjectNotifications } from "../../../_components/project-notifications";

interface NotificationSettingsPageProps {
  params: Promise<{ organizationId: string; projectId: string }>;
}

export default async function NotificationSettingsPage({
  params,
}: NotificationSettingsPageProps) {
  const { organizationId, projectId } = await params;

  return (
    <SettingsLayout
      title="Notifications"
      description="Manage your notification preferences for this project."
      navigationType="projectSettings"
      organizationId={organizationId}
      projectId={projectId}
    >
      <ProjectNotifications
        projectId={projectId}
        organizationId={organizationId}
      />
    </SettingsLayout>
  );
}

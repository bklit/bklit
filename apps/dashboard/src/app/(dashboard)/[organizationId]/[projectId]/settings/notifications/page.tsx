import { PageHeader } from "@/components/header/page-header";
import { ProjectNotifications } from "../../../_components/project-notifications";
import { ProjectSettingsNavigation } from "../(general)/page";

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
      />

      <div className="container mx-auto py-6 px-4 flex gap-4">
        <div className="w-1/6">
          <ProjectSettingsNavigation params={params} />
        </div>

        <div className="w-5/6">
          <ProjectNotifications
            projectId={projectId}
            organizationId={organizationId}
          />
        </div>
      </div>
    </>
  );
}

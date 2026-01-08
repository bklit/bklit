import { UpdateNotificationPreferencesForm } from "@/components/forms/update-notification-preferences-form";

interface ProjectNotificationsProps {
  projectId: string;
  organizationId: string;
}

export const ProjectNotifications = ({
  projectId,
  organizationId,
}: ProjectNotificationsProps) => {
  return (
    <div className="prose dark:prose-invert max-w-none space-y-6">
      <UpdateNotificationPreferencesForm
        organizationId={organizationId}
        projectId={projectId}
      />
    </div>
  );
};

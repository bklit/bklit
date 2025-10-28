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
    <div className="space-y-6 prose dark:prose-invert max-w-none">
      <UpdateNotificationPreferencesForm
        projectId={projectId}
        organizationId={organizationId}
      />
    </div>
  );
};

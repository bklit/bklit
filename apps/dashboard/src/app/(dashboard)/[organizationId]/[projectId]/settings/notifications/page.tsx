"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Switch } from "@bklit/ui/components/switch";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/header/page-header";
import { useTRPC } from "@/trpc/react";

interface NotificationSettingsPageProps {
  params: Promise<{ organizationId: string; projectId: string }>;
}

export default function NotificationSettingsPage({
  params,
}: NotificationSettingsPageProps) {
  const [organizationId, setOrganizationId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [liveVisitorToasts, setLiveVisitorToasts] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize params
  useEffect(() => {
    params.then(({ organizationId, projectId }) => {
      setOrganizationId(organizationId);
      setProjectId(projectId);
    });
  }, [params]);

  // Get tRPC client
  const trpc = useTRPC();

  // Get notification preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery(
    trpc.notification.getPreferences.queryOptions(
      {
        projectId,
        organizationId,
      },
      {
        enabled: !!projectId && !!organizationId,
      },
    ),
  );

  // Update preferences mutation
  const updatePreferences = useMutation(
    trpc.notification.updatePreferences.mutationOptions({
      onSuccess: () => {
        toast.success("Notification preferences updated");
      },
      onError: (error) => {
        toast.error(`Failed to update preferences: ${error.message}`);
      },
    }),
  );

  // Update local state when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setLiveVisitorToasts(preferences.liveVisitorToasts);
    }
  }, [preferences]);

  const handleToggleLiveVisitorToasts = async (enabled: boolean) => {
    if (!projectId || !organizationId) return;

    setIsLoading(true);
    setLiveVisitorToasts(enabled);

    try {
      await updatePreferences.mutateAsync({
        projectId,
        organizationId,
        liveVisitorToasts: enabled,
      });
    } catch {
      // Revert on error
      setLiveVisitorToasts(!enabled);
    } finally {
      setIsLoading(false);
    }
  };

  if (preferencesLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader
          title="Notifications"
          description="Manage your notification preferences for this project."
        />
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader
        title="Notifications"
        description="Manage your notification preferences for this project."
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Live Visitor Notifications</CardTitle>
            <CardDescription>
              Get notified when new visitors arrive on your website in
              real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Live Visitor Toasts</div>
                <div className="text-sm text-muted-foreground">
                  Show toast notifications when new visitors arrive
                </div>
              </div>
              <Switch
                checked={liveVisitorToasts}
                onCheckedChange={handleToggleLiveVisitorToasts}
                disabled={isLoading}
              />
            </div>

            {liveVisitorToasts && (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                <p>
                  You'll receive toast notifications showing the visitor's
                  location and device type when they first arrive on your
                  website. Notifications are debounced to prevent spam.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

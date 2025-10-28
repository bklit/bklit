"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@bklit/ui/components/field";
import { Switch } from "@bklit/ui/components/switch";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/react";

interface UpdateNotificationPreferencesFormProps {
  projectId: string;
  organizationId: string;
}

export function UpdateNotificationPreferencesForm({
  projectId,
  organizationId,
}: UpdateNotificationPreferencesFormProps) {
  const [liveVisitorToasts, setLiveVisitorToasts] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  const trpc = useTRPC();

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
      setLiveVisitorToasts(!enabled);
    } finally {
      setIsLoading(false);
    }
  };

  if (preferencesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Visitor Notifications</CardTitle>
          <CardDescription>
            Get notified when new visitors arrive on your website in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Visitor Notifications</CardTitle>
        <CardDescription>
          Get notified when new visitors arrive on your website in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <FieldLabel>Live Visitor Toasts</FieldLabel>
                <FieldDescription>
                  Show toast notifications when new visitors arrive
                </FieldDescription>
              </div>
              <Switch
                checked={liveVisitorToasts}
                onCheckedChange={handleToggleLiveVisitorToasts}
                disabled={isLoading}
              />
            </div>
          </Field>
        </FieldGroup>

        {liveVisitorToasts && (
          <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <p>
              You'll receive toast notifications showing the visitor's location
              and device type when they first arrive on your website.
              Notifications are debounced to prevent spam.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

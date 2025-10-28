"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/trpc/react";

const formSchema = z.object({
  liveVisitorToasts: z.boolean(),
});

interface UpdateNotificationPreferencesFormProps {
  projectId: string;
  organizationId: string;
}

export function UpdateNotificationPreferencesForm({
  projectId,
  organizationId,
}: UpdateNotificationPreferencesFormProps) {
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

  const form = useForm({
    defaultValues: {
      liveVisitorToasts: true,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (!projectId || !organizationId) return;

      try {
        await updatePreferences.mutateAsync({
          projectId,
          organizationId,
          liveVisitorToasts: value.liveVisitorToasts,
        });
      } catch (error) {
        toast.error(
          `Failed to update preferences: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  });

  useEffect(() => {
    if (preferences) {
      form.setFieldValue("liveVisitorToasts", preferences.liveVisitorToasts);
    }
  }, [preferences, form]);

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
        <form
          id="update-notification-preferences-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="liveVisitorToasts">
              {(field) => (
                <Field>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FieldLabel>Live Visitor Toasts</FieldLabel>
                      <FieldDescription>
                        Show toast notifications when new visitors arrive
                      </FieldDescription>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                      disabled={updatePreferences.isPending}
                    />
                  </div>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>

        {form.getFieldValue("liveVisitorToasts") && (
          <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <p>
              You'll receive toast notifications showing the visitor's location
              and device type when they first arrive on your website.
              Notifications are debounced to prevent spam.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="justify-between">
          <Button
            type="submit"
            form="update-notification-preferences-form"
            disabled={updatePreferences.isPending}
          >
            {updatePreferences.isPending ? "Updating..." : "Update preferences"}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}

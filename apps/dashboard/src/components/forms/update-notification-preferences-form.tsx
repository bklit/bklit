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

  const { data: preferences } = useQuery(
    trpc.notification.getPreferences.queryOptions(
      {
        projectId,
        organizationId,
      },
      {
        enabled: !!projectId && !!organizationId,
      }
    )
  );

  const updatePreferences = useMutation(
    trpc.notification.updatePreferences.mutationOptions({
      onSuccess: () => {
        toast.success("Notification preferences updated");
      },
      onError: (error) => {
        toast.error(`Failed to update preferences: ${error.message}`);
      },
    })
  );

  const form = useForm({
    defaultValues: {
      liveVisitorToasts: true,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (!(projectId && organizationId)) return;

      try {
        await updatePreferences.mutateAsync({
          projectId,
          organizationId,
          liveVisitorToasts: value.liveVisitorToasts,
        });
      } catch (error) {
        toast.error(
          `Failed to update preferences: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  });

  useEffect(() => {
    if (preferences) {
      form.setFieldValue("liveVisitorToasts", preferences.liveVisitorToasts);
    }
  }, [preferences, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Notifications</CardTitle>
        <CardDescription>
          Manage your notification preferences for this project.
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
                        {field.state.value
                          ? "Show toast notifications when new visitors arrive"
                          : "Hide toast notifications when new visitors arrive"}
                      </FieldDescription>
                    </div>
                    <Switch
                      checked={field.state.value}
                      disabled={updatePreferences.isPending}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                  </div>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field className="justify-between" orientation="horizontal">
          <Button
            disabled={updatePreferences.isPending}
            form="update-notification-preferences-form"
            type="submit"
          >
            {updatePreferences.isPending ? "Updating..." : "Update preferences"}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}

"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Input } from "@bklit/ui/components/input";
import { CopyInput } from "@bklit/ui/components/input-copy";
import { Label } from "@bklit/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bklit/ui/components/select";
import { Switch } from "@bklit/ui/components/switch";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/react";

export function DeploymentTrackingForm({ projectId }: { projectId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: webhook } = useQuery({
    ...trpc.deployment.getWebhook.queryOptions({ projectId }),
  });

  const saveMutation = useMutation(
    trpc.deployment.saveWebhook.mutationOptions({
      onSuccess: () => {
        toast.success("Deployment tracking configured!");
        queryClient.invalidateQueries({
          queryKey: [["deployment", "getWebhook"]],
        });
      },
      onError: (error) => {
        toast.error(`Failed to save: ${error.message}`);
      },
    }),
  );

  const toggleMutation = useMutation(
    trpc.deployment.toggleWebhook.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [["deployment", "getWebhook"]],
        });
        toast.success("Deployment tracking updated");
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      platform: webhook?.platform || "vercel",
      platformProjectId: webhook?.platformProjectId || "",
    },
    onSubmit: async ({ value }) => {
      await saveMutation.mutateAsync({
        projectId,
        platform: value.platform,
        platformProjectId: value.platformProjectId,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deployment Tracking</CardTitle>
            <CardDescription>
              Track deployments from Vercel, Netlify, Railway, or other
              platforms
            </CardDescription>
          </div>
          {webhook && (
            <Switch
              checked={webhook.enabled}
              onCheckedChange={(enabled) =>
                toggleMutation.mutate({ projectId, enabled })
              }
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <form.Field name="platform">
              {(field) => (
                <div className="space-y-2 w-full max-w-full sm:max-w-xs">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vercel">Vercel</SelectItem>
                      <SelectItem value="netlify">Netlify</SelectItem>
                      <SelectItem value="railway">Railway</SelectItem>
                      <SelectItem value="render">Render</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            <form.Field name="platformProjectId">
              {(field) => (
                <div className="space-y-2 w-full">
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input
                    id="projectId"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={
                      form.state.values.platform === "vercel"
                        ? "prj_xxxxxxxxxxxxx"
                        : form.state.values.platform === "netlify"
                          ? "site_xxxxxxxxxxxxx"
                          : "Project ID from platform"
                    }
                  />
                </div>
              )}
            </form.Field>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL:</Label>
            <CopyInput
              id="webhookUrl"
              value={`https://app.bklit.com/api/webhooks/${form.state.values.platform}`}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={
              !form.state.values.platformProjectId ||
              saveMutation.isPending ||
              form.state.isSubmitting
            }
          >
            {saveMutation.isPending || form.state.isSubmitting
              ? "Saving..."
              : "Save Configuration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

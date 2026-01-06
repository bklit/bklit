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
import { Label } from "@bklit/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bklit/ui/components/select";
import { Switch } from "@bklit/ui/components/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/react";

export function DeploymentTrackingForm({ projectId }: { projectId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: webhook } = useQuery({
    ...trpc.deployment.getWebhook.queryOptions({ projectId }),
  });

  const [platform, setPlatform] = useState(webhook?.platform || "vercel");
  const [platformProjectId, setPlatformProjectId] = useState(
    webhook?.platformProjectId || "",
  );

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

  const handleSave = () => {
    saveMutation.mutate({
      projectId,
      platform,
      platformProjectId,
    });
  };

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
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="platform">Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger>
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

        <div>
          <Label htmlFor="projectId">Project ID</Label>
          <Input
            id="projectId"
            value={platformProjectId}
            onChange={(e) => setPlatformProjectId(e.target.value)}
            placeholder={
              platform === "vercel"
                ? "prj_xxxxxxxxxxxxx"
                : platform === "netlify"
                  ? "site_xxxxxxxxxxxxx"
                  : "Project ID from platform"
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            Found in your {platform} project settings
          </p>
        </div>

        <div className="bg-muted p-3 rounded-lg text-sm">
          <p className="font-medium mb-1">Webhook URL:</p>
          <code className="text-xs">
            https://app.bklit.com/api/webhooks/{platform}
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            Configure this URL in your {platform} project webhooks
          </p>
        </div>

        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
}

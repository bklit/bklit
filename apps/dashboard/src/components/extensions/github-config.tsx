"use client";

import {
  Alert,
  AlertDescription,
  AlertFooter,
  AlertTitle,
} from "@bklit/ui/components/alert";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import { Checkbox } from "@bklit/ui/components/checkbox";
import { Label } from "@bklit/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bklit/ui/components/select";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/auth/client";
import { useTRPC } from "@/trpc/react";

interface GitHubConfigProps {
  organizationId: string;
  projectId: string;
  config: {
    repository?: string;
    productionWorkflows?: string[];
    productionBranch?: string;
  };
  onChange: (config: {
    repository?: string;
    productionWorkflows?: string[];
    productionBranch?: string;
  }) => void;
}

export function GitHubConfig({
  organizationId,
  projectId,
  config,
  onChange,
}: GitHubConfigProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [selectedRepo, setSelectedRepo] = useState(config.repository || "");

  const saveInstallation = useMutation(
    trpc.github.saveInstallation.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [["github", "getInstallation"]],
        });
        toast.success("GitHub account linked!");
      },
    })
  );

  // Handle return from GitHub OAuth (run once on mount if param exists)
  useEffect(() => {
    const githubConnectedParam = searchParams.get("github_connected");

    if (githubConnectedParam === "true" && !saveInstallation.isPending) {
      console.log("[GITHUB CONFIG] Calling saveInstallation mutation");
      saveInstallation.mutate({ organizationId });

      // Remove the param to prevent re-running
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    organizationId,
    saveInstallation.isPending,
    saveInstallation.mutate,
    searchParams.get,
  ]); // Run once on mount

  const { data: installation } = useQuery({
    ...trpc.github.getInstallation.queryOptions({ organizationId }),
  });

  const { data: repositories } = useQuery({
    ...trpc.github.listRepositories.queryOptions({ organizationId }),
    enabled: !!installation,
  });

  const { data: workflows } = useQuery({
    ...trpc.github.listWorkflows.queryOptions({
      organizationId,
      repository: selectedRepo,
    }),
    enabled: !!selectedRepo,
  });

  const [webhookExists, setWebhookExists] = useState(false);

  // Check if webhook already exists when repository changes
  const { data: existingWebhook } = useQuery({
    ...trpc.github.checkWebhook.queryOptions({
      organizationId,
      repository: selectedRepo,
    }),
    enabled: !!selectedRepo,
  });

  // Update webhook exists state when data changes
  React.useEffect(() => {
    if (existingWebhook) {
      setWebhookExists(true);
    }
  }, [existingWebhook]);

  const setupWebhook = useMutation(
    trpc.github.setupWebhook.mutationOptions({
      onSuccess: (_data) => {
        toast.success("Webhook configured successfully!");
        setWebhookExists(true);
      },
      onError: (error) => {
        toast.error(`Failed to setup webhook: ${error.message}`);
      },
    })
  );

  const handleLinkGitHub = async () => {
    try {
      await authClient.linkSocial({
        provider: "github",
        callbackURL: `/${organizationId}/${projectId}/settings/extensions?github_connected=true`,
        scopes: ["repo", "read:org", "workflow"],
      });
    } catch (error) {
      console.error("Failed to link GitHub:", error);
      toast.error("Failed to connect GitHub");
    }
  };

  const handleSetupWebhook = () => {
    if (!selectedRepo) {
      return;
    }

    setupWebhook.mutate({
      organizationId,
      projectId,
      repository: selectedRepo,
    });
  };

  if (!installation) {
    return (
      <Button onClick={handleLinkGitHub}>
        <GitHubIcon className="size-4" />
        Link GitHub Account
      </Button>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge size="lg" variant="success">
          <GitHubIcon className="size-3" />
          Connected to GitHub
        </Badge>

        <Button onClick={handleLinkGitHub} size="sm" variant="secondary">
          <GitHubIcon className="size-3" /> Manage Permissions
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Repository</Label>
        <Select
          onValueChange={(value) => {
            setSelectedRepo(value);
            onChange({ ...config, repository: value });
          }}
          value={selectedRepo}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select repository" />
          </SelectTrigger>
          <SelectContent>
            {repositories?.map((repo) => (
              <SelectItem key={repo.id} value={repo.fullName}>
                {repo.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRepo && workflows && (
        <>
          <div className="space-y-2">
            <Label>Production Workflows</Label>
            <p className="mb-2 text-muted-foreground text-sm">
              Select workflows that deploy to production
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border bg-input/50 p-3">
              {workflows.map((workflow) => (
                <Label
                  className="group flex cursor-pointer items-center justify-between font-medium text-sm"
                  htmlFor={`workflow-${workflow.id}`}
                  key={workflow.id}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={config.productionWorkflows?.includes(
                        workflow.name
                      )}
                      className="group-hover:border-bklit-400"
                      id={`workflow-${workflow.id}`}
                      onCheckedChange={(checked) => {
                        const current = config.productionWorkflows || [];
                        onChange({
                          ...config,
                          productionWorkflows: checked
                            ? [...current, workflow.name]
                            : current.filter((w) => w !== workflow.name),
                        });
                      }}
                    />
                    {workflow.name}
                  </div>
                  <span className="font-mono text-muted-foreground text-xs">
                    {workflow.recentRuns?.length || 0} recent runs
                  </span>
                </Label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Production Branch</Label>
            <Select
              onValueChange={(value) =>
                onChange({ ...config, productionBranch: value })
              }
              value={config.productionBranch || "main"}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">main</SelectItem>
                <SelectItem value="master">master</SelectItem>
                <SelectItem value="production">production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {webhookExists && (
            <Alert variant="success">
              <CheckCircle2Icon size={16} />
              <AlertTitle>Webhook Created</AlertTitle>
              <AlertDescription>
                Deployments will now be tracked automatically
              </AlertDescription>
              <AlertFooter>
                <Button asChild size="lg" variant="outline">
                  <a
                    href={`https://github.com/${selectedRepo}/settings/hooks`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <GitHubIcon className="size-4" /> Manage {selectedRepo}{" "}
                    webhooks
                  </a>
                </Button>
              </AlertFooter>
            </Alert>
          )}

          <Button
            className="w-full"
            disabled={setupWebhook.isPending}
            onClick={handleSetupWebhook}
            size="lg"
            variant={webhookExists ? "outline" : "default"}
          >
            {(() => {
              if (setupWebhook.isPending) {
                return "Setting up webhook...";
              }
              if (webhookExists) {
                return "Recreate Webhook";
              }
              return "Setup GitHub Webhook";
            })()}
          </Button>
        </>
      )}
    </div>
  );
}

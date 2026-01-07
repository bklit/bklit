"use client";

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
import { ExternalLink, Github } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  onChange: (config: any) => void;
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
    }),
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
  }, []); // Run once on mount

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

  const setupWebhook = useMutation(
    trpc.github.setupWebhook.mutationOptions({
      onSuccess: () => {
        toast.success("Webhook configured successfully!");
      },
      onError: (error) => {
        toast.error(`Failed to setup webhook: ${error.message}`);
      },
    }),
  );

  const handleLinkGitHub = async () => {
    try {
      await authClient.linkSocial({
        provider: "github",
        callbackURL: `/${organizationId}/${projectId}/settings/extensions?github_connected=true`,
        scope: ["repo", "read:org", "workflow"],
      });
    } catch (error) {
      console.error("Failed to link GitHub:", error);
      toast.error("Failed to connect GitHub");
    }
  };

  const handleSetupWebhook = () => {
    if (!selectedRepo) return;

    setupWebhook.mutate({
      organizationId,
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
        <Badge variant="success" size="lg">
          Connected to GitHub
        </Badge>

        <Button variant="secondary" size="sm" onClick={handleLinkGitHub}>
          Manage Access
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Repository</Label>
        <Select
          value={selectedRepo}
          onValueChange={(value) => {
            setSelectedRepo(value);
            onChange({ ...config, repository: value });
          }}
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
            <p className="text-sm text-muted-foreground mb-2">
              Select workflows that deploy to production
            </p>
            <div className="space-y-2 bg-input/50 border border-border rounded-lg p-3 max-h-64 overflow-y-auto">
              {workflows.map((workflow) => (
                <Label
                  key={workflow.id}
                  htmlFor={`workflow-${workflow.id}`}
                  className="font-medium cursor-pointer text-sm flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`workflow-${workflow.id}`}
                      checked={config.productionWorkflows?.includes(
                        workflow.name,
                      )}
                      onCheckedChange={(checked) => {
                        const current = config.productionWorkflows || [];
                        onChange({
                          ...config,
                          productionWorkflows: checked
                            ? [...current, workflow.name]
                            : current.filter((w) => w !== workflow.name),
                        });
                      }}
                      className="group-hover:border-bklit-400"
                    />
                    {workflow.name}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {workflow.recentRuns?.length || 0} recent runs
                  </span>
                </Label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Production Branch</Label>
            <Select
              value={config.productionBranch || "main"}
              onValueChange={(value) =>
                onChange({ ...config, productionBranch: value })
              }
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

          <Button
            onClick={handleSetupWebhook}
            variant="outline"
            className="w-full"
            disabled={setupWebhook.isPending}
          >
            {setupWebhook.isPending
              ? "Setting up webhook..."
              : "Setup GitHub Webhook"}
          </Button>
        </>
      )}
    </div>
  );
}

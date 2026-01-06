"use client";

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
      <div className="text-center py-8">
        <div className="size-12 mx-auto mb-4 text-muted-foreground flex items-center justify-center">
          <Github className="size-12" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Connect GitHub</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your GitHub account to track workflow deployments
        </p>
        <Button onClick={handleLinkGitHub}>
          <ExternalLink className="size-4 mr-2" />
          Link GitHub Account
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="size-10" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                ✓ Connected to GitHub
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                @{installation.githubUsername}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLinkGitHub}>
            <ExternalLink className="size-3 mr-1" />
            Manage Access
          </Button>
        </div>
      </div>

      <div>
        <Label>Repository</Label>
        <Select
          value={selectedRepo}
          onValueChange={(value) => {
            setSelectedRepo(value);
            onChange({ ...config, repository: value });
          }}
        >
          <SelectTrigger>
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
          <div>
            <Label>Production Workflows</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select workflows that deploy to production
            </p>
            <div className="space-y-2 border rounded-lg p-3 max-h-64 overflow-y-auto">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="flex items-start space-x-2">
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
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`workflow-${workflow.id}`}
                      className="font-medium cursor-pointer text-sm"
                    >
                      {workflow.name}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {workflow.recentRuns?.length || 0} recent runs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Production Branch</Label>
            <Select
              value={config.productionBranch || "main"}
              onValueChange={(value) =>
                onChange({ ...config, productionBranch: value })
              }
            >
              <SelectTrigger>
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

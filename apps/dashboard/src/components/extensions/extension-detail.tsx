"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExtensionHeader } from "@/components/extensions/extension-header";
import { ExtensionReadme } from "@/components/extensions/extension-readme";
import { ProjectSelector } from "@/components/extensions/project-selector";
import { PageHeader } from "@/components/header/page-header";
import { useTRPC } from "@/trpc/react";

interface ExtensionDetailProps {
  organizationId: string;
  extensionId: string;
}

export function ExtensionDetail({
  organizationId,
  extensionId,
}: ExtensionDetailProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: extension, isLoading: extensionLoading } = useQuery({
    ...trpc.extension.get.queryOptions({ extensionId }),
  });

  const { data: organization, isLoading: organizationLoading } = useQuery({
    ...trpc.organization.fetch.queryOptions({ id: organizationId }),
  });

  const projects = organization?.projects || [];

  // Get list of projects that already have this extension activated
  const { data: activatedExtensions } = useQuery({
    ...trpc.extension.listForOrganization.queryOptions({
      organizationId,
      extensionId,
    }),
    enabled: !!organizationId && !!extensionId,
  });

  const activatedProjectIds =
    activatedExtensions?.map((ext) => ext.projectId) || [];

  const activateMutation = useMutation(
    trpc.extension.activate.mutationOptions({
      onSuccess: () => {
        toast.success("Extension activated successfully");
        queryClient.invalidateQueries({
          queryKey: [["extension", "listForProject"]],
        });
        queryClient.invalidateQueries({
          queryKey: [["extension", "listForOrganization"]],
        });
        router.push(`/${organizationId}/extensions`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const removeMutation = useMutation(
    trpc.extension.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Extension deactivated");
        queryClient.invalidateQueries({
          queryKey: [["extension", "listForProject"]],
        });
        queryClient.invalidateQueries({
          queryKey: [["extension", "listForOrganization"]],
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleActivate = (projectIds: string[]) => {
    activateMutation.mutate({
      organizationId,
      extensionId,
      projectIds,
    });
  };

  const handleRemove = (projectId: string, projectName: string) => {
    removeMutation.mutate({
      organizationId,
      extensionId,
      projectIds: [projectId],
    });
  };

  if (extensionLoading || organizationLoading) {
    return (
      <>
        <PageHeader title="Loading..." description="Please wait..." />
        <div className="container mx-auto">Loading extension details...</div>
      </>
    );
  }

  if (!extension) {
    return (
      <>
        <PageHeader title="Not Found" description="Extension not found" />
        <div className="container mx-auto">
          <p className="text-muted-foreground">
            This extension does not exist.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={extension.displayName}
        description={extension.description}
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${organizationId}/extensions`}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Extensions
          </Link>
        </Button>
      </PageHeader>

      <div className="container mx-auto space-y-6">
        <ExtensionHeader
          extensionId={extensionId}
          displayName={extension.displayName}
          description={extension.description}
          author={extension.author}
          version={extension.version}
          category={extension.category}
          isPro={extension.isPro}
          icon={extension.icon}
          projects={projects}
          activatedProjectIds={activatedProjectIds}
          onActivate={handleActivate}
          onRemove={handleRemove}
          isActivating={activateMutation.isPending || removeMutation.isPending}
        />

        <ExtensionReadme extensionId={extensionId} />
      </div>
    </>
  );
}

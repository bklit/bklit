"use client";

import { Button } from "@bklit/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExtensionHeader } from "@/components/extensions/extension-header";
import { ExtensionReadme } from "@/components/extensions/extension-readme";
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
          queryKey: [
            "extension",
            "listForProject",
            { projectId: organizationId },
          ],
        });
        queryClient.invalidateQueries({
          queryKey: [
            "extension",
            "listForOrganization",
            { organizationId, extensionId },
          ],
        });
        router.push(`/${organizationId}/extensions`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const removeMutation = useMutation(
    trpc.extension.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Extension deactivated");
        queryClient.invalidateQueries({
          queryKey: ["extension", "listForProject"],
        });
        queryClient.invalidateQueries({
          queryKey: [
            "extension",
            "listForOrganization",
            { organizationId, extensionId },
          ],
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleActivate = (projectIds: string[]) => {
    activateMutation.mutate({
      organizationId,
      extensionId,
      projectIds,
    });
  };

  const handleRemove = (projectId: string) => {
    removeMutation.mutate({
      organizationId,
      extensionId,
      projectIds: [projectId],
    });
  };

  if (extensionLoading || organizationLoading) {
    return (
      <>
        <PageHeader description="Please wait..." title="Loading..." />
        <div className="container mx-auto">Loading extension details...</div>
      </>
    );
  }

  if (!extension) {
    return (
      <>
        <PageHeader description="Extension not found" title="Not Found" />
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
        description={extension.description}
        title={extension.displayName}
      >
        <Button asChild size="sm" variant="ghost">
          <Link href={`/${organizationId}/extensions`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Extensions
          </Link>
        </Button>
      </PageHeader>

      <div className="container mx-auto space-y-6">
        <ExtensionHeader
          activatedProjectIds={activatedProjectIds}
          author={extension.author}
          category={extension.category}
          description={extension.description}
          displayName={extension.displayName}
          extensionId={extensionId}
          icon={extension.icon}
          isActivating={activateMutation.isPending || removeMutation.isPending}
          isPro={extension.isPro}
          onActivate={handleActivate}
          onRemove={handleRemove}
          projects={projects}
          version={extension.version}
        />

        <ExtensionReadme extensionId={extensionId} />
      </div>
    </>
  );
}

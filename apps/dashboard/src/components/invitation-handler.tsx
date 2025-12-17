"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/react";

export function InvitationHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invitationId = searchParams.get("invitationId");
  const shouldAutoAccept =
    searchParams.get("invited") === "true" && invitationId;

  const acceptInvite = useMutation(
    trpc.invitation.accept.mutationOptions({
      onSuccess: async (data) => {
        toast.success(data.message);

        // Invalidate and refetch to get updated data
        await queryClient.invalidateQueries({
          queryKey: [["invitation", "list"]],
          type: "all",
          refetchType: "all",
        });
        await queryClient.invalidateQueries({
          queryKey: [["organization", "list"]],
          type: "all",
          refetchType: "all",
        });

        // Wait briefly for UI to update
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Handle demo project differently from regular invitations
        if (data.isDemoProject && data.organizationId) {
          // For demo project, fetch the organization to get project info
          const orgQueryResult = await queryClient.fetchQuery(
            trpc.organization.fetch.queryOptions({ id: data.organizationId }),
          );

          const demoProject = orgQueryResult?.projects[0];

          if (demoProject) {
            router.push(`/${data.organizationId}/${demoProject.id}?demo=true`);
          } else {
            // Fallback to organization dashboard
            router.push(`/${data.organizationId}?demo=true`);
          }
        } else if (data.organizationId) {
          // Regular invitation - redirect to organization
          router.push(`/${data.organizationId}`);
        } else {
          // Fallback to root
          router.push("/");
        }
      },
      onError: (error) => {
        toast.error(`Failed to accept invitation: ${error.message}`);
        // Clear invitation params from URL on error
        router.push("/");
      },
    }),
  );

  useEffect(() => {
    if (shouldAutoAccept && invitationId && !acceptInvite.isPending) {
      // Auto-accept the invitation
      acceptInvite.mutate({ invitationId });
    }
  }, [shouldAutoAccept, invitationId, acceptInvite]);

  return null;
}

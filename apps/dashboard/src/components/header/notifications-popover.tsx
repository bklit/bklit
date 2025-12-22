"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@bklit/ui/components/drawer";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bklit/ui/components/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@bklit/ui/components/item";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bklit/ui/components/popover";
import { useMediaQuery } from "@bklit/ui/hooks/use-media-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { InvitationAcceptedModal } from "@/components/modals/invitation-accepted-modal";
import { useTRPC } from "@/trpc/react";

export function NotificationsPopover() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Query param for invitation accepted
  const [, setInvitedParam] = useQueryState("invited", parseAsBoolean);

  // Controlled open state
  const [isOpen, setIsOpen] = useState(false);

  // State for accepted organization ID
  const [acceptedOrgId, setAcceptedOrgId] = useState<string | null>(null);

  const { data: invitations = [] } = useQuery(
    trpc.invitation.list.queryOptions()
  );

  const acceptInvite = useMutation(
    trpc.invitation.accept.mutationOptions({
      onSuccess: async (data) => {
        toast.success(data.message);

        // Invalidate and refetch to get updated data immediately
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

        // Wait a brief moment for UI to update
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Close the notifications popover after data is refreshed
        setIsOpen(false);

        // Handle demo project differently from regular invitations
        if (data.isDemoProject && data.organizationId) {
          // For demo project, fetch the organization to get project info
          const orgQueryResult = await queryClient.fetchQuery(
            trpc.organization.fetch.queryOptions({ id: data.organizationId })
          );

          const demoProject = orgQueryResult?.projects[0];

          if (demoProject) {
            router.push(`/${data.organizationId}/${demoProject.id}?demo=true`);
          } else {
            // Fallback to organization dashboard
            router.push(`/${data.organizationId}?demo=true`);
          }
        } else {
          // Regular invitation - show congratulations modal
          setInvitedParam(true);
          setAcceptedOrgId(data.organizationId || null);
        }
      },
      onError: (error) => {
        toast.error(`Failed to accept invitation: ${error.message}`);
      },
    })
  );

  const declineInvite = useMutation(
    trpc.invitation.decline.mutationOptions({
      onSuccess: async (data) => {
        toast.success(data.message);

        // Invalidate and refetch to update invitation list
        await queryClient.invalidateQueries({
          queryKey: [["invitation", "list"]],
          type: "all",
          refetchType: "all",
        });

        // Close popover after data is refreshed
        setIsOpen(false);
      },
      onError: (error) => {
        toast.error(`Failed to decline invitation: ${error.message}`);
      },
    })
  );

  const hasNotifications = invitations.length > 0;

  if (isDesktop) {
    return (
      <>
        <Popover onOpenChange={setIsOpen} open={isOpen}>
          <PopoverTrigger asChild>
            <Button
              className="relative cursor-pointer"
              size="icon"
              variant="outline"
            >
              <Bell size={14} />
              {hasNotifications && (
                <span
                  className="absolute -top-1.5 -right-1.5 block size-3 rounded-full bg-primary text-[10px] text-white"
                  data-count={invitations.length}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            {hasNotifications && (
              <div className="border-b px-4 py-3">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  You have {invitations.length} pending invitation
                  {invitations.length > 1 ? "s" : ""}
                </p>
              </div>
            )}

            {invitations.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <Bell size={16} />
                  </EmptyMedia>
                  <EmptyTitle className="text-muted-foreground text-sm">
                    No new notifications
                  </EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <ItemGroup className="max-h-[400px] overflow-y-auto">
                {invitations.map((invitation) => (
                  <Item key={invitation.id} size="sm" variant="outline">
                    <ItemContent>
                      <ItemTitle>
                        Invitation to {invitation.organization.name}
                      </ItemTitle>
                      <ItemDescription>
                        You were invited to join as{" "}
                        {invitation.role || "member"}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Button
                        disabled={
                          declineInvite.isPending || acceptInvite.isPending
                        }
                        onClick={() =>
                          declineInvite.mutate({
                            invitationId: invitation.id,
                          })
                        }
                        size="sm"
                        variant="outline"
                      >
                        Decline
                      </Button>
                      <Button
                        disabled={
                          acceptInvite.isPending || declineInvite.isPending
                        }
                        onClick={() =>
                          acceptInvite.mutate({
                            invitationId: invitation.id,
                          })
                        }
                        size="sm"
                      >
                        Accept
                      </Button>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            )}
          </PopoverContent>
        </Popover>
        <InvitationAcceptedModal organizationId={acceptedOrgId} />
      </>
    );
  }

  return (
    <>
      <Drawer onOpenChange={setIsOpen} open={isOpen}>
        <DrawerTrigger asChild>
          <Button
            className="relative cursor-pointer"
            size="icon"
            variant="ghost"
          >
            <Bell size={14} />
            {hasNotifications && (
              <span
                className="absolute -top-1.5 -right-1.5 block size-3 rounded-full bg-primary text-[10px] text-white"
                data-count={invitations.length}
              />
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Notifications</DrawerTitle>
          </DrawerHeader>
          {hasNotifications && (
            <div className="border-b px-4 py-3">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <p className="mt-0.5 text-muted-foreground text-xs">
                You have {invitations.length} pending invitation
                {invitations.length > 1 ? "s" : ""}
              </p>
            </div>
          )}
          {invitations.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia>
                  <Bell size={16} />
                </EmptyMedia>
                <EmptyTitle className="text-muted-foreground text-sm">
                  No new notifications
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="max-h-[400px] overflow-y-auto">
              {invitations.map((invitation) => (
                <Item key={invitation.id} size="sm" variant="outline">
                  <ItemContent>
                    <ItemTitle>
                      Invitation to {invitation.organization.name}
                    </ItemTitle>
                    <ItemDescription>
                      You were invited to join as {invitation.role || "member"}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      disabled={
                        declineInvite.isPending || acceptInvite.isPending
                      }
                      onClick={() =>
                        declineInvite.mutate({
                          invitationId: invitation.id,
                        })
                      }
                      size="sm"
                      variant="outline"
                    >
                      Decline
                    </Button>
                    <Button
                      disabled={
                        acceptInvite.isPending || declineInvite.isPending
                      }
                      onClick={() =>
                        acceptInvite.mutate({
                          invitationId: invitation.id,
                        })
                      }
                      size="sm"
                    >
                      Accept
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </DrawerContent>
      </Drawer>
      <InvitationAcceptedModal organizationId={acceptedOrgId} />
    </>
  );
}

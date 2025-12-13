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
import { toast } from "sonner";
import { useTRPC } from "@/trpc/react";

export function NotificationsPopover() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { data: invitations = [] } = useQuery(
    trpc.invitation.list.queryOptions(),
  );

  const acceptInvite = useMutation(
    trpc.invitation.accept.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({
          queryKey: ["invitation", "list"],
        });
        queryClient.invalidateQueries({
          queryKey: ["organization", "list"],
        });
        // Navigate to the organization
        if (data.organizationId) {
          router.push(`/${data.organizationId}`);
        }
      },
      onError: (error) => {
        toast.error(`Failed to accept invitation: ${error.message}`);
      },
    }),
  );

  const declineInvite = useMutation(
    trpc.invitation.decline.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({
          queryKey: ["invitation", "list"],
        });
      },
      onError: (error) => {
        toast.error(`Failed to decline invitation: ${error.message}`);
      },
    }),
  );

  const hasNotifications = invitations.length > 0;

  if (isDesktop) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="relative cursor-pointer"
          >
            <Bell size={14} />
            {hasNotifications && (
              <span
                data-count={invitations.length}
                className="absolute -top-1.5 -right-1.5 size-3 block text-[10px] bg-brand-500 text-white rounded-full "
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 p-0">
          {hasNotifications && (
            <div className="border-b px-4 py-3">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
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
                <EmptyTitle className="text-sm text-muted-foreground">
                  No new notifications
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="max-h-[400px] overflow-y-auto">
              {invitations.map((invitation) => (
                <Item key={invitation.id} variant="outline" size="sm">
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
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        declineInvite.mutate({
                          invitationId: invitation.id,
                        })
                      }
                      disabled={
                        declineInvite.isPending || acceptInvite.isPending
                      }
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        acceptInvite.mutate({
                          invitationId: invitation.id,
                        })
                      }
                      disabled={
                        acceptInvite.isPending || declineInvite.isPending
                      }
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
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="relative cursor-pointer"
        >
          <Bell size={14} />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Notifications</DrawerTitle>
        </DrawerHeader>
        {hasNotifications && (
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
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
              <EmptyTitle className="text-sm text-muted-foreground">
                No new notifications
              </EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="max-h-[400px] overflow-y-auto">
            {invitations.map((invitation) => (
              <Item key={invitation.id} variant="outline" size="sm">
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
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      declineInvite.mutate({
                        invitationId: invitation.id,
                      })
                    }
                    disabled={declineInvite.isPending || acceptInvite.isPending}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      acceptInvite.mutate({
                        invitationId: invitation.id,
                      })
                    }
                    disabled={acceptInvite.isPending || declineInvite.isPending}
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
  );
}

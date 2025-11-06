"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/react";

export function NotificationsPopover() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <Bell className="size-5" />
          {hasNotifications && (
            <Badge
              className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {invitations.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {hasNotifications && (
            <p className="text-xs text-muted-foreground mt-0.5">
              You have {invitations.length} pending invitation
              {invitations.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {invitations.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="size-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-sm text-muted-foreground">
              No new notifications
            </p>
          </div>
        ) : (
          <ItemGroup className="max-h-[400px] overflow-y-auto">
            {invitations.map((invitation) => (
              <Item key={invitation.id} variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle>
                    Invitation to {invitation.organization.name}
                  </ItemTitle>
                  <ItemDescription>
                    {invitation.user.name} invited you to join as{" "}
                    {invitation.role || "member"}
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
      </PopoverContent>
    </Popover>
  );
}

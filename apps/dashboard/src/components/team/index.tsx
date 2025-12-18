"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bklit/ui/components/select";
import { hasPermission, MemberRole } from "@bklit/utils/roles";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteMemberForm } from "@/components/forms/delete-member-form";
import { InviteMemberForm } from "@/components/forms/invite-member-form";
import { PageHeader } from "@/components/header/page-header";
import { useTRPC } from "@/trpc/react";

interface TeamProps {
  organizationId: string;
}

interface MemberToDelete {
  id: string;
  name: string;
  email: string;
}

export const Team = ({ organizationId }: TeamProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<MemberToDelete | null>(
    null,
  );

  const { data: membersData } = useSuspenseQuery(
    trpc.organization.members.list.queryOptions({
      organizationId,
      page,
      limit: 15,
    }),
  );

  const { data: organization } = useSuspenseQuery(
    trpc.organization.fetch.queryOptions({
      id: organizationId,
    }),
  );

  const updateRole = useMutation(
    trpc.organization.members.updateRole.mutationOptions({
      onSuccess: async () => {
        toast.success("Member role updated successfully!");
        await queryClient.invalidateQueries({
          queryKey: ["organization", "members", "list", { organizationId }],
        });
        await queryClient.invalidateQueries({
          queryKey: ["organization", "fetch", { id: organizationId }],
        });
      },
      onError: (error) => {
        toast.error(`Failed to update role: ${error.message}`);
      },
    }),
  );

  const handleRoleUpdate = async (memberId: string, newRole: string) => {
    await updateRole.mutateAsync({
      organizationId,
      memberId,
      role: newRole as "owner" | "admin" | "member",
    });
  };

  const handleDeleteClick = (member: {
    id: string;
    user: { name: string; email: string };
  }) => {
    setMemberToDelete({
      id: member.id,
      name: member.user.name,
      email: member.user.email,
    });
    setDeleteDialogOpen(true);
  };

  const canManageMembers = hasPermission(
    organization.userMembership.role,
    MemberRole.ADMIN,
  );

  const startIndex = (page - 1) * 15 + 1;
  const endIndex = Math.min(page * 15, membersData.totalCount);

  return (
    <>
      <PageHeader title="Team" description="Manage your team members.">
        {canManageMembers && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus size={16} />
            Invite Member
          </Button>
        )}
      </PageHeader>

      <div className="w-full flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {membersData.totalCount}{" "}
              {membersData.totalCount === 1 ? "member" : "members"} in your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {membersData.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar>
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback>
                        {member.user.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{member.user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canManageMembers ? (
                      <Select
                        value={member.role}
                        onValueChange={(role) =>
                          handleRoleUpdate(member.id, role)
                        }
                        disabled={updateRole.isPending}
                      >
                        <SelectTrigger size="sm" className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={
                          member.role === "owner" ? "default" : "outline"
                        }
                      >
                        {member.role}
                      </Badge>
                    )}
                    {canManageMembers && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(member)}
                        aria-label="Remove member"
                      >
                        <Trash size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {membersData.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex}-{endIndex} of {membersData.totalCount}{" "}
                  members
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === membersData.totalPages}
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <InviteMemberForm
        organizationId={organizationId}
        isOpen={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => {
          // Refresh the members list after successful invite
          setPage(1);
        }}
      />

      {memberToDelete && (
        <DeleteMemberForm
          organizationId={organizationId}
          memberId={memberToDelete.id}
          memberName={memberToDelete.name}
          memberEmail={memberToDelete.email}
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={() => {
            // If the current page is now empty, go to previous page
            if (membersData.members.length === 1 && page > 1) {
              setPage(page - 1);
            }
          }}
        />
      )}
    </>
  );
};

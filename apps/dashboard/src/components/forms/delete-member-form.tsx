"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { Input } from "@bklit/ui/components/input";
import { Label } from "@bklit/ui/components/label";
import { MemberRole } from "@bklit/utils/roles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FormPermissions } from "@/components/permissions/form-permissions";
import { useTRPC } from "@/trpc/react";

interface DeleteMemberFormProps {
  organizationId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteMemberForm({
  organizationId,
  memberId,
  memberName,
  memberEmail,
  isOpen,
  onOpenChange,
  onSuccess,
}: DeleteMemberFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [confirmationInput, setConfirmationInput] = useState("");

  const deleteMember = useMutation(
    trpc.organization.members.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Member removed successfully!");
        queryClient.invalidateQueries({
          queryKey: ["organization", "members", "list", { organizationId }],
        });
        queryClient.invalidateQueries({
          queryKey: ["organization", "fetch", { id: organizationId }],
        });
        setConfirmationInput("");
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(`Failed to remove member: ${error.message}`);
      },
    })
  );

  const handleDelete = async () => {
    if (confirmationInput !== memberEmail) {
      toast.error("Email does not match");
      return;
    }

    await deleteMember.mutateAsync({
      organizationId,
      memberId,
      confirmEmail: confirmationInput,
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <FormPermissions inModal requiredRole={MemberRole.ADMIN}>
          <DialogHeader>
            <DialogTitle>Remove Team Member: {memberName}</DialogTitle>
            <DialogDescription>
              To permanently remove this team member, please enter their email
              address &quot;
              <span className="font-semibold">{memberEmail}</span>&quot; below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                className="sr-only text-right"
                htmlFor="member-email-confirmation"
              >
                Member Email
              </Label>
              <Input
                className="col-span-4"
                id="member-email-confirmation"
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={memberEmail}
                type="email"
                value={confirmationInput}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={deleteMember.isPending} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              disabled={
                deleteMember.isPending || confirmationInput !== memberEmail
              }
              onClick={handleDelete}
              variant="destructive"
            >
              {deleteMember.isPending ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </FormPermissions>
      </DialogContent>
    </Dialog>
  );
}

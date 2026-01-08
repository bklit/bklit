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

interface DeleteApiTokenFormProps {
  organizationId: string;
  tokenId: string;
  tokenName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteApiTokenForm({
  organizationId,
  tokenId,
  tokenName,
  isOpen,
  onOpenChange,
  onSuccess,
}: DeleteApiTokenFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [confirmationInput, setConfirmationInput] = useState("");

  const deleteToken = useMutation(
    trpc.apiToken.delete.mutationOptions({
      onSuccess: () => {
        toast.success("API token deleted successfully!");
        queryClient.invalidateQueries({
          queryKey: ["apiToken", "list", { organizationId }],
        });
        setConfirmationInput("");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(`Failed to delete token: ${error.message}`);
      },
    })
  );

  const handleDelete = async () => {
    if (confirmationInput !== tokenName) {
      toast.error("Token name does not match");
      return;
    }

    await deleteToken.mutateAsync({
      id: tokenId,
      organizationId,
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <FormPermissions inModal requiredRole={MemberRole.ADMIN}>
          <DialogHeader>
            <DialogTitle>Delete API Token: {tokenName}</DialogTitle>
            <DialogDescription>
              To permanently delete this API token, please enter &quot;
              <span className="font-semibold">{tokenName}</span>&quot; below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                className="sr-only text-right"
                htmlFor="token-name-confirmation"
              >
                Token Name
              </Label>
              <Input
                className="col-span-4"
                id="token-name-confirmation"
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={tokenName}
                value={confirmationInput}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={deleteToken.isPending} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              disabled={
                deleteToken.isPending || confirmationInput !== tokenName
              }
              onClick={handleDelete}
              variant="destructive"
            >
              {deleteToken.isPending ? "Deleting..." : "Delete Token"}
            </Button>
          </DialogFooter>
        </FormPermissions>
      </DialogContent>
    </Dialog>
  );
}

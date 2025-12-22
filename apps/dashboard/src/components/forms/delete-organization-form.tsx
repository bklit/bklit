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
  DialogTrigger,
} from "@bklit/ui/components/dialog";
import { Input } from "@bklit/ui/components/input";
import { Label } from "@bklit/ui/components/label";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteOrganizationAction,
  type OrganizationFormState,
} from "@/actions/organization-actions";
import { authClient } from "@/auth/client";

interface DeleteOrganizationFormProps {
  organizationId: string;
  organizationName: string;
}

const initialState: OrganizationFormState = {
  success: false,
  message: "",
};

export function DeleteOrganizationForm({
  organizationId,
  organizationName,
}: DeleteOrganizationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [state, formAction] = useActionState(
    deleteOrganizationAction,
    initialState
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
        setIsOpen(false);
        setConfirmationInput("");

        router.refresh();

        if (session?.user?.id) {
          queryClient.invalidateQueries({
            queryKey: ["userOrganizations", session.user.id],
          });
        }

        router.push("/");
      } else {
        toast.error(state.message);
      }
    }
  }, [state, router, queryClient, session]);

  const handleSubmitDeletion = () => {
    if (confirmationInput === organizationName) {
      const formData = new FormData();
      formData.append("organizationId", organizationId);
      formData.append("confirmedOrganizationName", confirmationInput);
      startTransition(() => {
        formAction(formData);
      });
    } else {
      toast.error(
        "Organization name does not match. Please type it correctly to confirm."
      );
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setConfirmationInput("");
    }
  }, [isOpen]);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="destructive">
          Delete organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Organization: {organizationName}</DialogTitle>
          <DialogDescription>
            To permanently delete this organization and all associated data,
            please enter &quot;
            <span className="font-semibold">{organizationName}</span>&quot;
            below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              className="sr-only text-right"
              htmlFor="organization-name-confirmation"
            >
              Organization Name
            </Label>
            <Input
              className="col-span-4"
              id="organization-name-confirmation"
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={organizationName}
              value={confirmationInput}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={isPending || confirmationInput !== organizationName}
            onClick={handleSubmitDeletion}
            variant="destructive"
          >
            {isPending ? "Deleting..." : "Delete Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

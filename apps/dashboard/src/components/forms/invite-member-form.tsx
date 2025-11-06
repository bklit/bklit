"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@bklit/ui/components/field";
import { Input } from "@bklit/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bklit/ui/components/select";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { inviteMemberSchema } from "@/lib/schemas/invitation-schema";
import { useTRPC } from "@/trpc/react";

interface InviteMemberFormProps {
  organizationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteMemberForm({
  organizationId,
  isOpen,
  onOpenChange,
  onSuccess,
}: InviteMemberFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const sendInvite = useMutation(
    trpc.invitation.create.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation sent successfully!");
        queryClient.invalidateQueries({
          queryKey: ["organization", "fetch", { id: organizationId }],
        });
        form.reset();
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(`Failed to send invitation: ${error.message}`);
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      email: "",
      role: "member" as "member" | "admin" | "owner",
      organizationId,
    },
    validators: {
      onSubmit: inviteMemberSchema,
    },
    onSubmit: async ({ value }) => {
      await sendInvite.mutateAsync({
        email: value.email,
        role: value.role,
        organizationId: value.organizationId,
      });
    },
  });

  const handleClose = () => {
    if (!sendInvite.isPending) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to add a new member to your organization.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="email">
            {(field) => (
              <FieldGroup>
                <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                <Field>
                  <Input
                    id={field.name}
                    type="email"
                    placeholder="colleague@example.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={sendInvite.isPending}
                  />
                </Field>
                <FieldDescription>
                  We'll send an invitation email to this address.
                </FieldDescription>
                {field.state.meta.errors.length > 0 && (
                  <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                )}
              </FieldGroup>
            )}
          </form.Field>

          <form.Field name="role">
            {(field) => (
              <FieldGroup>
                <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                <Field>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(value as "member" | "admin" | "owner")
                    }
                    disabled={sendInvite.isPending}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">
                        Member - Can view and create projects
                      </SelectItem>
                      <SelectItem value="admin">
                        Admin - Can manage members and settings
                      </SelectItem>
                      <SelectItem value="owner">
                        Owner - Full access and control
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <FieldDescription>
                  Choose the permission level for this member.
                </FieldDescription>
                {field.state.meta.errors.length > 0 && (
                  <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                )}
              </FieldGroup>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={sendInvite.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sendInvite.isPending}>
              {sendInvite.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

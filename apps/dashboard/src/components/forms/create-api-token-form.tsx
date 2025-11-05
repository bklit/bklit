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
import { CopyInput } from "@bklit/ui/components/input-copy";
import { Textarea } from "@bklit/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/trpc/react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  projectIds: z
    .array(z.string())
    .min(1, "At least one project must be selected"),
});

interface CreateApiTokenFormProps {
  organizationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateApiTokenForm({
  organizationId,
  isOpen,
  onOpenChange,
  onSuccess,
}: CreateApiTokenFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const { data: organization } = useQuery(
    trpc.organization.fetch.queryOptions({ id: organizationId }),
  );

  const createToken = useMutation(
    trpc.apiToken.create.mutationOptions({
      onSuccess: (data) => {
        if (!data.token) {
          toast.error("Token was created but could not be retrieved");
          return;
        }
        setCreatedToken(data.token);
        queryClient.invalidateQueries({
          queryKey: ["apiToken", "list", { organizationId }],
        });
        // Don't call onSuccess here - we'll call it when user clicks "Done"
      },
      onError: (error) => {
        toast.error(`Failed to create token: ${error.message}`);
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      projectIds: [] as string[],
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await createToken.mutateAsync({
        organizationId,
        name: value.name,
        description: value.description || undefined,
        projectIds: value.projectIds,
      });
    },
  });

  const handleClose = () => {
    if (!createToken.isPending) {
      setCreatedToken(null);
      form.reset();
      onOpenChange(false);
      // Only call onSuccess when dialog actually closes after showing token
      if (createdToken) {
        onSuccess?.();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create API Token</DialogTitle>
          <DialogDescription>
            Create a new API token to authenticate your tracking requests.
          </DialogDescription>
        </DialogHeader>

        {createdToken ? (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-sm font-medium">Your API Token</p>
              <p className="mb-4 text-xs text-muted-foreground">
                Copy this token now. You won&apos;t be able to see it again!
              </p>
              <CopyInput value={createdToken} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form
            id="create-api-token-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <FieldGroup>
              <form.Field name="name">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Production Token"
                        autoComplete="off"
                      />
                      <FieldDescription>
                        A descriptive name for this token.
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="description">
                {(field) => {
                  return (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Description (optional)
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Token for production environment"
                        rows={3}
                      />
                      <FieldDescription>
                        An optional description for this token.
                      </FieldDescription>
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="projectIds">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Assign to Projects</FieldLabel>
                      <FieldDescription>
                        Select which projects this token can access.
                      </FieldDescription>
                      <div className="space-y-2 rounded-md border p-4">
                        {organization?.projects?.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No projects available. Create a project first.
                          </p>
                        ) : (
                          organization?.projects?.map((project) => (
                            <label
                              key={project.id}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={field.state.value.includes(project.id)}
                                onChange={(e) => {
                                  const current = field.state.value;
                                  if (e.target.checked) {
                                    field.handleChange([
                                      ...current,
                                      project.id,
                                    ]);
                                  } else {
                                    field.handleChange(
                                      current.filter((id) => id !== project.id),
                                    );
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{project.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>
          </form>
        )}

        <DialogFooter>
          {!createdToken && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={createToken.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-api-token-form"
                disabled={createToken.isPending}
              >
                {createToken.isPending ? "Creating..." : "Create Token"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

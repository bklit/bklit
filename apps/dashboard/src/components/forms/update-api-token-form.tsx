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
import { Textarea } from "@bklit/ui/components/textarea";
import { MemberRole } from "@bklit/utils/roles";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { FormPermissions } from "@/components/permissions/form-permissions";
import { useTRPC } from "@/trpc/react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable(),
  allowedDomains: z.string().optional(),
  projectIds: z
    .array(z.string())
    .min(1, "At least one project must be selected"),
});

interface UpdateApiTokenFormProps {
  organizationId: string;
  tokenId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UpdateApiTokenForm({
  organizationId,
  tokenId,
  isOpen,
  onOpenChange,
  onSuccess,
}: UpdateApiTokenFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: tokens } = useQuery(
    trpc.apiToken.list.queryOptions({ organizationId })
  );

  const token = tokens?.find((t) => t.id === tokenId);

  const { data: organization } = useQuery(
    trpc.organization.fetch.queryOptions({ id: organizationId })
  );

  const updateToken = useMutation(
    trpc.apiToken.update.mutationOptions({
      onSuccess: () => {
        toast.success("API token updated successfully!");
        queryClient.invalidateQueries({
          queryKey: ["apiToken", "list", { organizationId }],
        });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(`Failed to update token: ${error.message}`);
      },
    })
  );

  const form = useForm({
    defaultValues: {
      name: "",
      description: "" as string | null,
      allowedDomains: "",
      projectIds: [] as string[],
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      // Parse domains from comma or newline separated string
      const domains = value.allowedDomains
        ? value.allowedDomains
            .split(/[,\n]/)
            .map((d) => d.trim())
            .filter((d) => d.length > 0)
            .map((d) => {
              // Remove protocol if present
              try {
                const url = new URL(d.startsWith("http") ? d : `https://${d}`);
                return url.hostname;
              } catch {
                return d;
              }
            })
        : [];

      await updateToken.mutateAsync({
        id: tokenId,
        organizationId,
        name: value.name,
        description: value.description || null,
        allowedDomains: domains,
        projectIds: value.projectIds,
      });
    },
  });

  useEffect(() => {
    if (token) {
      form.setFieldValue("name", token.name);
      form.setFieldValue("description", token.description || "");
      form.setFieldValue(
        "allowedDomains",
        token.allowedDomains?.join("\n") || ""
      );
      form.setFieldValue(
        "projectIds",
        token.projects.map((p) => p.id)
      );
    }
  }, [token, form]);

  const handleClose = () => {
    if (!updateToken.isPending) {
      form.reset();
      onOpenChange(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <FormPermissions inModal requiredRole={MemberRole.ADMIN}>
          <DialogHeader>
            <DialogTitle>Edit API Token</DialogTitle>
            <DialogDescription>
              Update the name, description, or project assignments for this
              token.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            id="update-api-token-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
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
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Production Token"
                        value={field.state.value}
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
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Token for production environment"
                        rows={3}
                        value={field.state.value || ""}
                      />
                      <FieldDescription>
                        An optional description for this token.
                      </FieldDescription>
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="allowedDomains">
                {(field) => {
                  return (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Allowed Domains (optional)
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="example.com&#10;www.example.com&#10;app.example.com"
                        rows={3}
                        value={field.state.value || ""}
                      />
                      <FieldDescription>
                        Restrict this token to specific domains. Enter one
                        domain per line or comma-separated. Leave empty to allow
                        all domains. Examples: example.com, www.example.com
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
                          <p className="text-muted-foreground text-sm">
                            No projects available.
                          </p>
                        ) : (
                          organization?.projects?.map((project) => (
                            <label
                              className="flex cursor-pointer items-center space-x-2"
                              key={project.id}
                            >
                              <input
                                checked={field.state.value.includes(project.id)}
                                className="rounded border-gray-300"
                                onChange={(e) => {
                                  const current = field.state.value;
                                  if (e.target.checked) {
                                    field.handleChange([
                                      ...current,
                                      project.id,
                                    ]);
                                  } else {
                                    field.handleChange(
                                      current.filter((id) => id !== project.id)
                                    );
                                  }
                                }}
                                type="checkbox"
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

          <DialogFooter>
            <Button
              disabled={updateToken.isPending}
              onClick={handleClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={updateToken.isPending}
              form="update-api-token-form"
              type="submit"
            >
              {updateToken.isPending ? "Updating..." : "Update Token"}
            </Button>
          </DialogFooter>
        </FormPermissions>
      </DialogContent>
    </Dialog>
  );
}

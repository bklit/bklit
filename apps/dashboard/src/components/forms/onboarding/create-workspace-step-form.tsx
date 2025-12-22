"use client";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@bklit/ui/components/field";
import { Input } from "@bklit/ui/components/input";
import { Textarea } from "@bklit/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  createOrganizationAction,
  type OrganizationFormState,
} from "@/actions/organization-actions";
import { createOrganizationSchema } from "@/lib/schemas/organization-schema";

const initialState: OrganizationFormState = {
  success: false,
  message: "",
  newOrganizationId: undefined,
  errors: {},
};

interface CreateWorkspaceStepFormProps {
  onSuccess: (organizationId: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export function CreateWorkspaceStepForm({
  onSuccess,
  onLoadingChange,
}: CreateWorkspaceStepFormProps) {
  const [state, formAction] = useActionState(
    createOrganizationAction,
    initialState
  );
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    validators: {
      onSubmit: createOrganizationSchema,
    },
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.append("name", value.name);
      if (value.description) {
        formData.append("description", value.description);
      }

      startTransition(() => {
        formAction(formData);
      });
    },
  });

  useEffect(() => {
    onLoadingChange?.(isPending);
  }, [isPending, onLoadingChange]);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || "Workspace created successfully! 🎉");
      form.reset();
      if (state.newOrganizationId) {
        onSuccess(state.newOrganizationId);
      }
    } else if (state.message && !state.success) {
      if (state.errors) {
        Object.entries(state.errors).forEach(([key, errors]) => {
          if (errors && errors.length > 0) {
            const fieldName = key as "name" | "description";
            form.setFieldMeta(fieldName, (prev) => ({
              ...prev,
              errorMap: {
                onSubmit: errors,
              },
            }));
          }
        });
      }
      if (state.message) {
        toast.error(state.message);
      }
    }
  }, [state, form, onSuccess, onLoadingChange]);

  return (
    <>
      <form
        className="space-y-6"
        id="create-workspace-form"
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
                  <FieldLabel htmlFor={field.name}>Workspace Name</FieldLabel>
                  <Input
                    aria-invalid={isInvalid}
                    autoComplete="off"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="My Awesome Workspace"
                    value={field.state.value}
                  />
                  <FieldDescription>
                    A descriptive name for your workspace.
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="description">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Description (Optional)
                  </FieldLabel>
                  <Textarea
                    aria-invalid={isInvalid}
                    autoComplete="off"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="What does your workspace focus on?"
                    value={field.state.value}
                  />
                  <FieldDescription>
                    A brief description of your workspace&apos;s purpose.
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
        {state.message && !state.success && !state.errors && (
          <p className="font-medium text-destructive text-sm">
            {state.message}
          </p>
        )}
      </form>
      <input form="create-workspace-form" type="hidden" />
    </>
  );
}

export type { CreateWorkspaceStepFormProps };

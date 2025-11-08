"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@bklit/ui/components/field";
import { Input } from "@bklit/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { createProjectAction, type FormState } from "@/actions/project-actions";
import { authClient } from "@/auth/client";
import { addProjectSchema } from "@/lib/schemas/project-schema";

interface AddProjectFormProps {
  onSuccess?: (newprojectId?: string) => void;
}

const initialState: FormState = {
  success: false,
  message: "",
  newprojectId: undefined,
};

export function AddProjectForm({ onSuccess }: AddProjectFormProps) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const [state, formAction] = useActionState(createProjectAction, initialState);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      name: "",
      domain: "",
      organizationId: activeOrganization?.id || "",
    },
    validators: {
      onSubmit: addProjectSchema,
    },
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      Object.entries(value).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });

      startTransition(() => {
        formAction(formData);
      });
    },
  });

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      form.reset();
      if (onSuccess) {
        onSuccess(state.newprojectId);
      }
    } else if (state.message && !state.success) {
      if (state.errors) {
        Object.entries(state.errors).forEach(([key, errors]) => {
          if (errors && errors.length > 0) {
            const fieldName = key as "name" | "domain" | "organizationId";
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
  }, [state, form, onSuccess]);

  return (
    <form
      id="add-project-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <FieldGroup>
        <form.Field name="name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Project Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="My Awesome Project"
                  autoComplete="off"
                />
                <FieldDescription>
                  A descriptive name for your website or application.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="domain">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Domain</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="https://example.com"
                  type="url"
                  autoComplete="url"
                />
                <FieldDescription>
                  <code>localhost</code> is automatically detected.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>
      <Button
        type="submit"
        form="add-project-form"
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        {isPending ? "Creating Project..." : "Create Project"}
      </Button>
      {state.message && !state.success && !state.errors && (
        <p className="text-sm font-medium text-destructive">{state.message}</p>
      )}
    </form>
  );
}

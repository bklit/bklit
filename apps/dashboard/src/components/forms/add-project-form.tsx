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
import { addProjectSchema } from "@/lib/schemas/project-schema";

interface AddProjectFormProps {
  organizationId?: string;
  onSuccess?: (newprojectId?: string) => void;
}

const initialState: FormState = {
  success: false,
  message: "",
  newprojectId: undefined,
};

export function AddProjectForm({
  organizationId,
  onSuccess,
}: AddProjectFormProps) {
  console.log(
    "🔍 AddProjectForm - received organizationId prop:",
    organizationId
  );

  const [state, formAction] = useActionState(createProjectAction, initialState);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      name: "",
      domain: "",
      organizationId: organizationId || "",
    },
    validators: {
      onSubmit: ({ value }) => {
        console.log("📝 Validating form:", value);
        const result = addProjectSchema.safeParse(value);
        if (!result.success) {
          console.error("📝 Validation failed:", result.error);
          return result.error.format();
        }
        console.log("📝 Validation passed!");
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      console.log("📝 Add Project Form: Submitting with values:", value);

      // Validation: organizationId is required
      if (!value.organizationId) {
        toast.error(
          "No active organization found. Please select an organization."
        );
        return;
      }

      const formData = new FormData();
      Object.entries(value).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });

      console.log("📝 Add Project Form: Starting transition...");
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
      className="space-y-6"
      id="add-project-form"
      onSubmit={(e) => {
        e.preventDefault();
        console.log(
          "📝 Form submit triggered, current values:",
          form.state.values
        );
        console.log("📝 Form validation errors:", form.state.errors);
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
                <FieldLabel htmlFor={field.name}>Project Name</FieldLabel>
                <Input
                  aria-invalid={isInvalid}
                  autoComplete="off"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="My Awesome Project"
                  value={field.state.value}
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
                  aria-invalid={isInvalid}
                  autoComplete="url"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                  value={field.state.value}
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
        className="w-full sm:w-auto"
        disabled={isPending || form.state.isSubmitting}
        form="add-project-form"
        type="submit"
      >
        {isPending || form.state.isSubmitting
          ? "Creating Project..."
          : "Create Project"}
      </Button>
      {state.message && !state.success && !state.errors && (
        <p className="font-medium text-destructive text-sm">{state.message}</p>
      )}
    </form>
  );
}

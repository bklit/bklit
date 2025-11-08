"use client";

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

const initialState: FormState = {
  success: false,
  message: "",
  newprojectId: undefined,
};

interface CreateProjectStepFormProps {
  organizationId: string;
  onSuccess: (
    projectId: string,
    projectName: string,
    projectDomain: string,
  ) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export function CreateProjectStepForm({
  organizationId,
  onSuccess,
  onLoadingChange,
}: CreateProjectStepFormProps) {
  const [state, formAction] = useActionState(createProjectAction, initialState);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      name: "",
      domain: "",
      organizationId: organizationId,
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
    onLoadingChange?.(isPending);
  }, [isPending, onLoadingChange]);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || "Project created successfully! 🚀");
      const projectId = state.newprojectId;
      const projectName = form.state.values.name;
      const projectDomain = form.state.values.domain;
      form.reset();
      if (projectId) {
        onSuccess(projectId, projectName, projectDomain);
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
  }, [state, form, onSuccess, onLoadingChange]);

  return (
    <>
      <form
        id="create-project-form"
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
                    placeholder="https://foo.com"
                    type="url"
                    autoComplete="url"
                  />
                  <FieldDescription>
                    Your primary domain, <code>localhost</code> is automatically
                    detected.
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
        {state.message && !state.success && !state.errors && (
          <p className="text-sm font-medium text-destructive">
            {state.message}
          </p>
        )}
      </form>
      <input type="hidden" form="create-project-form" />
    </>
  );
}

export type { CreateProjectStepFormProps };

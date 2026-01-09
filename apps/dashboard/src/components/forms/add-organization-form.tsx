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
import { Textarea } from "@bklit/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
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

interface AddOrganizationFormProps {
  onSuccess?: () => void;
}

export function AddOrganizationForm({ onSuccess }: AddOrganizationFormProps) {
  const [state, formAction] = useActionState(
    createOrganizationAction,
    initialState
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    validators: {
      onSubmit: createOrganizationSchema,
    },
    onSubmit: ({ value }) => {
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
    if (state.success) {
      toast.success(state.message);
      form.reset();
      onSuccess?.();
      if (state.newOrganizationId) {
        router.push(`/${state.newOrganizationId}`);
      }
    } else if (state.message && !state.success) {
      if (state.errors) {
        for (const [key, errors] of Object.entries(state.errors)) {
          if (errors && errors.length > 0) {
            const fieldName = key as "name" | "description";
            form.setFieldMeta(fieldName, (prev) => ({
              ...prev,
              errorMap: {
                onSubmit: errors,
              },
            }));
          }
        }
      }
      if (state.message) {
        toast.error(state.message);
      }
    }
  }, [state, form, router, onSuccess]);

  return (
    <form
      className="space-y-6"
      id="add-organization-form"
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
                <FieldLabel htmlFor={field.name}>Organization Name</FieldLabel>
                <Input
                  aria-invalid={isInvalid}
                  autoComplete="off"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="My Awesome Organization"
                  value={field.state.value}
                />
                <FieldDescription>
                  A descriptive name for your organization.
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
                  placeholder="What does your organization work on?"
                  value={field.state.value}
                />
                <FieldDescription>
                  A brief description of your organization&apos;s purpose.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>
      <Button
        className="w-full sm:w-auto"
        disabled={isPending}
        form="add-organization-form"
        type="submit"
      >
        {isPending ? "Creating Organization..." : "Create Organization"}
      </Button>
      {state.message && !state.success && !state.errors && (
        <p className="font-medium text-destructive text-sm">{state.message}</p>
      )}
    </form>
  );
}

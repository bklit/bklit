"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@bklit/ui/components/field";
import { Input } from "@bklit/ui/components/input";
import { MemberRole } from "@bklit/utils/roles";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateOrganizationNameAction } from "@/actions/organization-actions";
import { FormPermissions } from "@/components/permissions/form-permissions";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters long.")
    .max(30, "Organization name must be 30 characters or less."),
});

interface UpdateOrganizationNameFormProps {
  organizationId: string;
  currentName: string;
}

export function UpdateOrganizationNameForm({
  organizationId,
  currentName,
}: UpdateOrganizationNameFormProps) {
  const form = useForm({
    defaultValues: {
      name: currentName,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await updateOrganizationNameAction(
        organizationId,
        value.name
      );

      if (result.success) {
        toast.success(result.message);
        form.reset();
      } else {
        toast.error(result.message);
      }
    },
  });

  return (
    <FormPermissions asChild requiredRole={MemberRole.ADMIN}>
      <Card>
        <CardHeader>
          <CardTitle>Team name</CardTitle>
          <CardDescription>
            This is the name of your team, it will be displayed in the dashboard
            and other places and is used to identify your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="update-organization-name-form"
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
                      <FieldLabel htmlFor={field.name}>
                        Organization name
                      </FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter organization name"
                        value={field.state.value}
                      />
                      <FieldDescription>
                        Choose a name that represents your team or organization.
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Field className="justify-between" orientation="horizontal">
            <Button form="update-organization-name-form" type="submit">
              Update name
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </FormPermissions>
  );
}

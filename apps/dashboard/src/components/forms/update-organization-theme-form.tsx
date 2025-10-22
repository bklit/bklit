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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bklit/ui/components/select";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateOrganizationThemeAction } from "@/actions/organization-actions";
import { useTRPC } from "@/trpc/react";

const formSchema = z.object({
  theme: z.string().min(1, "Please select a theme."),
});

const themes = [
  {
    value: "spring",
    label: "Spring",
    gradient: "from-lime-300 to-emerald-600",
  },
  {
    value: "summer",
    label: "Summer",
    gradient: "from-yellow-300 to-lime-500",
  },
  {
    value: "autumn",
    label: "Autumn",
    gradient: "from-orange-300 to-rose-600",
  },
  {
    value: "winter",
    label: "Winter",
    gradient: "from-cyan-300 to-indigo-800",
  },
];

interface UpdateOrganizationThemeFormProps {
  organizationId: string;
  currentTheme: string | null;
}

export function UpdateOrganizationThemeForm({
  organizationId,
  currentTheme,
}: UpdateOrganizationThemeFormProps) {
  const trpc = useTRPC();

  const form = useForm({
    defaultValues: {
      theme: currentTheme || "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await updateOrganizationThemeAction(
        organizationId,
        value.theme,
      );

      if (result.success) {
        // Invalidate the organization query to refetch the updated data
        await trpc.utils.organization.fetch.invalidate({ id: organizationId });
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team theme</CardTitle>
        <CardDescription>
          Choose a theme for your team. This will be used if you haven't
          uploaded an avatar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="update-organization-theme-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="theme">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Theme</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {themes.map((theme) => (
                          <SelectItem
                            key={theme.value}
                            value={theme.value}
                            className="flex items-center gap-2"
                          >
                            <div
                              className={`w-4 h-4 bg-gradient-to-br ${theme.gradient} rounded-full`}
                            />
                            <span>{theme.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Your team's theme will be used if you haven't uploaded an
                      avatar.
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
        <Field orientation="horizontal" className="justify-between">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="update-organization-theme-form">
            Update theme
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}

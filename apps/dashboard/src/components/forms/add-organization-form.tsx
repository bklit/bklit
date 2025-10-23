"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@bklit/ui/components/form";
import { Input } from "@bklit/ui/components/input";
import { Textarea } from "@bklit/ui/components/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  createOrganizationAction,
  type OrganizationFormState,
} from "@/actions/organization-actions";

const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Organization name must be at least 2 characters long.",
    })
    .max(50, { message: "Organization name must be 50 characters or less." }),
  description: z
    .string()
    .max(200, { message: "Description must be 200 characters or less." })
    .optional(),
});

type AddOrganizationFormValues = z.infer<typeof createOrganizationSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Creating Organization..." : "Create Organization"}
    </Button>
  );
}

export function AddOrganizationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction] = useActionState(
    createOrganizationAction as (
      prevState: OrganizationFormState,
      formData: FormData,
    ) => Promise<OrganizationFormState>,
    {
      success: false,
      message: "",
      newOrganizationId: undefined,
      errors: {},
    },
  );
  const [, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<AddOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      form.reset();
      onSuccess?.();
      if (state.newOrganizationId) {
        // Redirect to the new organization
        router.push(`/${state.newOrganizationId}`);
      }
    } else if (state.message && !state.success && state.errors) {
      Object.entries(state.errors).forEach(([key, value]) => {
        if (value && Array.isArray(value) && value.length > 0) {
          form.setError(key as keyof AddOrganizationFormValues, {
            type: "manual",
            message: value[0],
          });
        }
      });
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, form, router, onSuccess]);

  const onSubmit = (data: AddOrganizationFormValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Organization" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for your organization.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What does your organization work on?"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description of your organization&apos;s purpose.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton />
        {state.message && !state.success && !state.errors && (
          <p className="text-sm font-medium text-destructive">
            {state.message}
          </p>
        )}
      </form>
    </Form>
  );
}

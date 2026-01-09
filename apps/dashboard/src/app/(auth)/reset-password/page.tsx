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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/auth/client";
import { resetPasswordSchema } from "@/lib/schemas/auth-schema";

function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const token = searchParams.get("token");

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        toast.error("Invalid or missing reset token");
        return;
      }

      setIsLoading(true);
      try {
        const result = await authClient.resetPassword({
          newPassword: value.password,
          token,
        });

        if (result.error) {
          toast.error(
            result.error.message ||
              "Failed to reset password. Token may be expired."
          );
          setIsLoading(false);
        } else {
          toast.success("Password reset successfully!");
          router.push("/signin");
        }
      } catch (error) {
        console.error("Reset password error:", error);
        toast.error("An error occurred. Please try again.");
        setIsLoading(false);
      }
    },
  });

  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-normal text-2xl">
            Invalid <span className="font-bold">reset link</span>
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <Button onClick={() => router.push("/forgot-password")} size="lg">
          Request new link
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-normal text-2xl">
          Reset your <span className="font-bold">password</span>
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Enter your new password below
        </p>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="password">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                  <Input
                    aria-invalid={isInvalid}
                    autoComplete="new-password"
                    disabled={isLoading}
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    value={field.state.value}
                  />
                  <FieldDescription>
                    At least 8 characters with uppercase, lowercase, and a
                    special character
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="confirmPassword">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Confirm New Password
                  </FieldLabel>
                  <Input
                    aria-invalid={isInvalid}
                    autoComplete="new-password"
                    disabled={isLoading}
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    value={field.state.value}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>

        <Button
          className="w-full"
          disabled={isLoading || form.state.isSubmitting}
          size="lg"
          type="submit"
        >
          {isLoading || form.state.isSubmitting
            ? "Resetting..."
            : "Reset password"}
        </Button>
      </form>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}

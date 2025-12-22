"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@bklit/ui/components/field";
import { Input } from "@bklit/ui/components/input";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { GoogleIcon } from "@bklit/ui/icons/google";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/auth/client";
import { signInSchema } from "@/lib/schemas/auth-schema";

function LoginPage() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId");
  const invited = searchParams.get("invited") === "true";
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Build callback URL that preserves invitation parameters
  let callbackUrl = searchParams.get("callbackUrl") || "/";
  if (invited && invitationId) {
    const separator = callbackUrl.includes("?") ? "&" : "?";
    callbackUrl = `${callbackUrl}${separator}invited=true&invitationId=${encodeURIComponent(invitationId)}`;
  }

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        const result = await authClient.signIn.email({
          email: value.email,
          password: value.password,
          callbackURL: callbackUrl,
        });

        if (result.error) {
          toast.error(result.error.message || "Invalid email or password");
          setIsLoading(false);
        } else {
          toast.success("Welcome back!");
          // Router will handle redirect from callbackURL
        }
      } catch (error) {
        console.error("Sign in error:", error);
        toast.error("An error occurred. Please try again.");
        setIsLoading(false);
      }
    },
  });

  if (showEmailForm) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-normal text-2xl">
            Log in to <span className="font-bold">Bklit</span>
          </h1>
          {invited && (
            <p className="mt-2 text-muted-foreground text-sm">
              You've been invited to join a team on Bklit
            </p>
          )}
        </div>
        {invited && (
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-foreground text-sm">
              Sign in or create an account to view your invitation
            </p>
          </div>
        )}

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup className="flex flex-col gap-3">
            <form.Field name="email">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel className="sr-only" htmlFor={field.name}>
                      Email
                    </FieldLabel>
                    <Input
                      aria-invalid={isInvalid}
                      autoComplete="email"
                      disabled={isLoading}
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Email"
                      type="email"
                      value={field.state.value}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="password">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel className="sr-only" htmlFor={field.name}>
                      Password
                    </FieldLabel>
                    <Input
                      aria-invalid={isInvalid}
                      autoComplete="current-password"
                      disabled={isLoading}
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Password"
                      type="password"
                      value={field.state.value}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <div className="text-right">
            <Link
              className="text-muted-foreground text-sm transition-all hover:text-primary"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            className="w-full"
            disabled={isLoading || form.state.isSubmitting}
            size="lg"
            type="submit"
            variant="secondary"
          >
            {isLoading || form.state.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="space-y-3 text-center">
          <button
            className="cursor-pointer text-muted-foreground text-sm transition-all hover:text-primary"
            onClick={() => setShowEmailForm(false)}
            type="button"
          >
            Use another method
          </button>
          <p className="font-normal text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link
              className="text-card-foreground transition-all hover:text-primary"
              href="/signup"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-normal text-2xl">
          Log in to <span className="font-bold">Bklit</span>
        </h1>
        {invited && (
          <p className="mt-2 text-muted-foreground text-sm">
            You've been invited to join a team on Bklit
          </p>
        )}
      </div>
      {invited && (
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-foreground text-sm">
            Sign in or create an account to view your invitation
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          className="w-full"
          onClick={() => setShowEmailForm(true)}
          size="lg"
          variant="secondary"
        >
          Continue with Email
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full gap-2"
            onClick={() =>
              authClient.signIn.social({
                provider: "github",
                callbackURL: callbackUrl,
              })
            }
            size="lg"
            variant="mono"
          >
            <GitHubIcon className="size-5" />
            Continue with GitHub
          </Button>
          <Button
            className="w-full gap-2"
            onClick={() =>
              authClient.signIn.social({
                provider: "google",
                callbackURL: callbackUrl,
              })
            }
            size="lg"
            variant="outline"
          >
            <GoogleIcon className="size-5" />
            Continue with Google
          </Button>
        </div>
      </div>

      <div className="text-center">
        <p className="font-normal text-muted-foreground text-sm">
          Don't have an account?{" "}
          <Link
            className="text-card-foreground transition-all hover:text-primary"
            href="/signup"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}

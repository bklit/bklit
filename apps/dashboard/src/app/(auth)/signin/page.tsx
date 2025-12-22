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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/auth/client";
import { signInSchema } from "@/lib/schemas/auth-schema";

function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
          <h1 className="text-2xl font-normal">
            Log in to <span className="font-bold">Bklit</span>
          </h1>
          {invited && (
            <p className="text-sm text-muted-foreground mt-2">
              You've been invited to join a team on Bklit
            </p>
          )}
        </div>
        {invited && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-foreground">
              Sign in or create an account to view your invitation
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <FieldGroup className="flex flex-col gap-3">
            <form.Field name="email">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name} className="sr-only">
                      Email
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Email"
                      autoComplete="email"
                      disabled={isLoading}
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
                    <FieldLabel htmlFor={field.name} className="sr-only">
                      Password
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Password"
                      autoComplete="current-password"
                      disabled={isLoading}
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
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary transition-all"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="secondary"
            className="w-full"
            disabled={isLoading || form.state.isSubmitting}
          >
            {isLoading || form.state.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={() => setShowEmailForm(false)}
            className="text-sm text-muted-foreground hover:text-primary transition-all cursor-pointer"
          >
            Use another method
          </button>
          <p className="text-sm font-normal text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-card-foreground hover:text-primary transition-all"
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
        <h1 className="text-2xl font-normal">
          Log in to <span className="font-bold">Bklit</span>
        </h1>
        {invited && (
          <p className="text-sm text-muted-foreground mt-2">
            You've been invited to join a team on Bklit
          </p>
        )}
      </div>
      {invited && (
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-foreground">
            Sign in or create an account to view your invitation
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => setShowEmailForm(true)}
          size="lg"
          className="w-full"
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
            onClick={() =>
              authClient.signIn.social({
                provider: "github",
                callbackURL: callbackUrl,
              })
            }
            size="lg"
            className="w-full gap-2"
            variant="mono"
          >
            <GitHubIcon className="size-5" />
            Continue with GitHub
          </Button>
          <Button
            onClick={() =>
              authClient.signIn.social({
                provider: "google",
                callbackURL: callbackUrl,
              })
            }
            variant="outline"
            size="lg"
            className="w-full gap-2"
          >
            <GoogleIcon className="size-5" />
            Continue with Google
          </Button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-normal text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-card-foreground hover:text-primary transition-all"
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

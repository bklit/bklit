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
import { GitHubIcon } from "@bklit/ui/icons/github";
import { GoogleIcon } from "@bklit/ui/icons/google";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/auth/client";
import { signUpSchema } from "@/lib/schemas/auth-schema";

function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invitationId = searchParams.get("invitationId");
  const invited = searchParams.get("invited") === "true";
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [providers, setProviders] = useState<{
    github: boolean;
    google: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then(setProviders)
      .catch(() => setProviders({ github: false, google: false }));
  }, []);

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
      confirmPassword: "",
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        const result = await authClient.signUp.email({
          email: value.email,
          password: value.password,
          name: value.email.split("@")[0] || "User", // Use email username as default name
          callbackURL: callbackUrl,
        });

        if (result.error) {
          if (result.error.message?.includes("already exists")) {
            toast.error("An account with this email already exists");
          } else {
            toast.error(result.error.message || "Failed to create account");
          }
          setIsLoading(false);
        } else {
          // Send verification email
          const verificationResult =
            await authClient.emailOtp.sendVerificationOtp({
              email: value.email,
              type: "email-verification",
            });

          if (verificationResult.error) {
            console.error(
              "Failed to send verification email:",
              verificationResult.error
            );
            toast.error(
              "Account created but failed to send verification email. Please try resending."
            );
          } else {
            toast.success(
              "Account created! Please check your email to verify."
            );
          }

          router.push(`/verify-email?email=${encodeURIComponent(value.email)}`);
        }
      } catch (error) {
        console.error("Sign up error:", error);
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
            Sign up to <span className="font-bold">Bklit</span>
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
                      autoComplete="new-password"
                      disabled={isLoading}
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Password"
                      type="password"
                      value={field.state.value}
                    />
                    <FieldDescription className="text-center text-xs">
                      At least 8 characters with uppercase, lowercase, and a
                      special character
                    </FieldDescription>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
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
                    <FieldLabel className="sr-only" htmlFor={field.name}>
                      Confirm Password
                    </FieldLabel>
                    <Input
                      aria-invalid={isInvalid}
                      autoComplete="new-password"
                      disabled={isLoading}
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Repeat password"
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

          <Button
            className="w-full"
            disabled={isLoading || form.state.isSubmitting}
            size="lg"
            type="submit"
            variant="secondary"
          >
            {isLoading || form.state.isSubmitting
              ? "Creating account..."
              : "Create account"}
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
            Already have an account?{" "}
            <Link
              className="text-card-foreground transition-all hover:text-primary"
              href="/signin"
            >
              Log in
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
          Sign up to <span className="font-bold">Bklit</span>
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

        {(providers?.github || providers?.google) && (
          <>
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
              {providers?.github && (
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
              )}
              {providers?.google && (
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
              )}
            </div>
          </>
        )}
      </div>

      <div className="space-y-2 text-center">
        <p className="font-normal text-muted-foreground text-sm">
          By signing up, you agree to our{" "}
          <a
            className="text-card-foreground transition-all hover:text-primary"
            href="https://bklit.com/terms"
            rel="noopener noreferrer"
            target="_blank"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            className="text-card-foreground transition-all hover:text-primary"
            href="https://bklit.com/privacy"
            rel="noopener noreferrer"
            target="_blank"
          >
            Privacy Policy
          </a>
          .
        </p>
        <p className="font-normal text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link
            className="text-card-foreground transition-all hover:text-primary"
            href="/signin"
          >
            Log in
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

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
import { Suspense, useState } from "react";
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
          // Temporarily store password for auto sign-in after email verification
          sessionStorage.setItem("temp_signup_password", value.password);

          // Send verification email
          const verificationResult =
            await authClient.emailOtp.sendVerificationOtp({
              email: value.email,
              type: "email-verification",
            });

          if (verificationResult.error) {
            console.error(
              "Failed to send verification email:",
              verificationResult.error,
            );
            toast.error(
              "Account created but failed to send verification email. Please try resending.",
            );
          } else {
            toast.success(
              "Account created! Please check your email to verify.",
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
          <h1 className="text-2xl font-normal">
            Sign up to <span className="font-bold">Bklit</span>
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
                      autoComplete="new-password"
                      disabled={isLoading}
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
                    <FieldLabel htmlFor={field.name} className="sr-only">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Repeat password"
                      autoComplete="new-password"
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

          <Button
            type="submit"
            size="lg"
            variant="secondary"
            className="w-full"
            disabled={isLoading || form.state.isSubmitting}
          >
            {isLoading || form.state.isSubmitting
              ? "Creating account..."
              : "Create account"}
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
             Already have an account?{" "}
             <Link
               href="/signin"
               className="text-card-foreground hover:text-primary transition-all"
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
        <h1 className="text-2xl font-normal">
          Sign up to <span className="font-bold">Bklit</span>
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

      <div className="text-center space-y-2">
        <p className="text-sm font-normal text-muted-foreground">
          By signing up, you agree to our{" "}
          <a
            href="https://bklit.com/terms"
            className="text-card-foreground hover:text-primary transition-all"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://bklit.com/privacy"
            className="text-card-foreground hover:text-primary transition-all"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          .
        </p>
        <p className="text-sm font-normal text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-card-foreground hover:text-primary transition-all"
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

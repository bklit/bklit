"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@bklit/ui/components/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@bklit/ui/components/input-otp";
import NumberFlow from "@number-flow/react";
import { useForm } from "@tanstack/react-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/auth/client";
import { verifyEmailSchema } from "@/lib/schemas/auth-schema";

const RESEND_COOLDOWN_KEY = "verify-email-resend-cooldown";
const RESEND_COOLDOWN_SECONDS = 60;

function getResendCooldownRemaining(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  const cooldownStart = localStorage.getItem(RESEND_COOLDOWN_KEY);
  if (!cooldownStart) {
    return 0;
  }

  const elapsed = Date.now() - Number.parseInt(cooldownStart, 10);
  const remaining = RESEND_COOLDOWN_SECONDS * 1000 - elapsed;

  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(
    getResendCooldownRemaining()
  );
  const email = searchParams.get("email");

  // Validate email parameter on mount
  useEffect(() => {
    if (!email || email.trim() === "") {
      toast.error("Email address is missing. Please sign up again.");
      router.replace("/signup");
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      const remaining = getResendCooldownRemaining();
      setResendCooldown(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Initialize form before any conditional returns (Rules of Hooks)
  const form = useForm({
    defaultValues: {
      code: "",
    },
    validators: {
      onSubmit: verifyEmailSchema,
    },
    onSubmit: async ({ value }) => {
      // Guard: ensure email exists before proceeding
      if (!email || email.trim() === "") {
        toast.error("Email address is missing. Please sign up again.");
        router.replace("/signup");
        return;
      }

      setIsLoading(true);
      try {
        // Verify the email OTP
        const verifyResult = await authClient.emailOtp.verifyEmail({
          email,
          otp: value.code,
        });

        if (verifyResult.error) {
          toast.error(
            verifyResult.error.message || "Invalid or expired verification code"
          );
          setIsLoading(false);
          return;
        }

        // Email verified successfully
        // Better Auth's verifyEmail should automatically create a session
        toast.success("Email verified! Please sign in to continue.");
        router.push("/signin");
      } catch (error) {
        console.error("Verification error:", error);
        toast.error("An error occurred. Please try again.");
        setIsLoading(false);
      }
    },
  });

  // Early return if email is missing (will redirect in useEffect above)
  // Note: This comes AFTER all hooks to comply with Rules of Hooks
  if (!email || email.trim() === "") {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-normal text-2xl">
            Invalid <span className="font-bold">verification link</span>
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Email address is missing. Redirecting to sign up...
          </p>
        </div>
      </div>
    );
  }

  const handleResendCode = async () => {
    // Guard: ensure email exists before proceeding
    if (!email || email.trim() === "") {
      toast.error("Email address is missing. Please sign up again.");
      router.replace("/signup");
      return;
    }

    const cooldown = getResendCooldownRemaining();
    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown} seconds before resending.`);
      return;
    }

    setIsResending(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      // Set cooldown
      localStorage.setItem(RESEND_COOLDOWN_KEY, Date.now().toString());
      setResendCooldown(RESEND_COOLDOWN_SECONDS);

      if (result.error) {
        toast.error(
          result.error.message || "Failed to resend verification code"
        );
      } else {
        toast.success("Verification code sent! Check your email.");
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Failed to resend verification code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-normal text-2xl">
          Verify your <span className="font-bold">email</span>
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Verification code for{" "}
          <span className="font-medium">{email || "your email"}</span>
        </p>
      </div>

      <form
        className="mx-auto flex w-sm max-w-full flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="code">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel className="sr-only" htmlFor={field.name}>
                    Verification Code
                  </FieldLabel>
                  <InputOTP
                    aria-invalid={isInvalid}
                    disabled={isLoading}
                    maxLength={6}
                    onBlur={field.handleBlur}
                    onChange={(value) => field.handleChange(value)}
                    value={field.state.value}
                  >
                    <InputOTPGroup className="flex w-full items-stretch justify-center">
                      <InputOTPSlot
                        className="aspect-square size-auto flex-1"
                        index={0}
                      />
                      <InputOTPSlot
                        className="aspect-square size-auto flex-1"
                        index={1}
                      />
                      <InputOTPSlot
                        className="aspect-square size-auto flex-1"
                        index={2}
                      />
                      <InputOTPSlot
                        className="aspect-square size-auto flex-1"
                        index={3}
                      />
                      <InputOTPSlot
                        className="aspect-square size-auto flex-1"
                        index={4}
                      />
                      <InputOTPSlot
                        className="aspect-square size-auto flex-1"
                        index={5}
                      />
                    </InputOTPGroup>
                  </InputOTP>
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
            ? "Verifying..."
            : "Verify Email"}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          Didn't receive the code?{" "}
          <button
            className="inline-flex cursor-pointer items-center gap-1 font-medium text-card-foreground transition-all hover:text-primary disabled:opacity-50"
            disabled={isResending || resendCooldown > 0}
            onClick={handleResendCode}
            type="button"
          >
            {(() => {
              if (isResending) {
                return "Sending...";
              }
              if (resendCooldown > 0) {
                return (
                  <>
                    Wait{" "}
                    <NumberFlow
                      className="tabular-nums"
                      value={resendCooldown}
                    />
                    s
                  </>
                );
              }
              return "Resend";
            })()}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailPage />
    </Suspense>
  );
}

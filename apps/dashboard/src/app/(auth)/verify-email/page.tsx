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
  if (typeof window === "undefined") return 0;
  const cooldownStart = localStorage.getItem(RESEND_COOLDOWN_KEY);
  if (!cooldownStart) return 0;
  
  const elapsed = Date.now() - parseInt(cooldownStart, 10);
  const remaining = RESEND_COOLDOWN_SECONDS * 1000 - elapsed;
  
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(getResendCooldownRemaining());
  const email = searchParams.get("email");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    
    const timer = setInterval(() => {
      const remaining = getResendCooldownRemaining();
      setResendCooldown(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const form = useForm({
    defaultValues: {
      code: "",
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = verifyEmailSchema.safeParse(value);
        if (!result.success) {
          return result.error.format();
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        // Verify the email OTP
        const verifyResult = await authClient.emailOtp.verifyEmail({
          email: email || "",
          otp: value.code,
        });

        if (verifyResult.error) {
          toast.error(
            verifyResult.error.message || "Invalid or expired verification code"
          );
          setIsLoading(false);
          return;
        }

        // Email verified successfully - now we need to sign the user in
        // Get the user's password from session storage (stored during signup)
        const tempPassword = sessionStorage.getItem("temp_signup_password");
        
        if (tempPassword && email) {
          // Sign in the user automatically
          const signInResult = await authClient.signIn.email({
            email,
            password: tempPassword,
          });

          // Clear the temporary password
          sessionStorage.removeItem("temp_signup_password");

          if (signInResult.error) {
            toast.error("Email verified but auto sign-in failed. Please sign in manually.");
            router.push("/signin");
            return;
          }
        }

        toast.success("Email verified successfully! Let's get you set up.");
        // Redirect to onboarding for first-time user experience
        router.push("/onboarding");
      } catch (error) {
        console.error("Verification error:", error);
        toast.error("An error occurred. Please try again.");
        setIsLoading(false);
      }
    },
  });

  const handleResendCode = async () => {
    if (!email) {
      toast.error("Email address not found. Please sign up again.");
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
        toast.error(result.error.message || "Failed to resend verification code");
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
        <h1 className="text-2xl font-normal">
          Verify your <span className="font-bold">email</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          We sent a verification code to{" "}
          <span className="font-medium text-foreground">{email || "your email"}</span>
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <FieldGroup>
          <form.Field
            name="code"
            validators={{
              onChange: ({ value }) => {
                if (value.length < 6) {
                  return "Code must be 6 digits";
                }
                if (!/^\d+$/.test(value)) {
                  return "Code must only contain numbers";
                }
                return undefined;
              },
            }}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Verification Code
                  </FieldLabel>
                  <InputOTP
                    maxLength={6}
                    value={field.state.value}
                    onChange={(value) => field.handleChange(value)}
                    onBlur={field.handleBlur}
                    disabled={isLoading}
                    aria-invalid={isInvalid}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || form.state.isSubmitting}
        >
          {isLoading || form.state.isSubmitting ? "Verifying..." : "Verify Email"}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending || resendCooldown > 0}
            className="text-card-foreground hover:text-primary transition-all font-medium disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
          >
            {isResending ? (
              "Sending..."
            ) : resendCooldown > 0 ? (
              <>
                Wait{" "}
                <NumberFlow
                  value={resendCooldown}
                  className="tabular-nums"
                />
                s
              </>
            ) : (
              "Resend"
            )}
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


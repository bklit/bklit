"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@bklit/ui/components/field";
import { Input } from "@bklit/ui/components/input";
import NumberFlow from "@number-flow/react";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/auth/client";
import { forgotPasswordSchema } from "@/lib/schemas/auth-schema";

const RATE_LIMIT_KEY = "forgot-password-attempts";
const COOLDOWN_KEY = "forgot-password-cooldown";
const COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS_PER_HOUR = 3;

interface AttemptRecord {
  timestamp: number;
}

function getRateLimitData(): AttemptRecord[] {
  if (typeof window === "undefined") {
    return [];
  }
  const data = localStorage.getItem(RATE_LIMIT_KEY);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function addAttempt() {
  const attempts = getRateLimitData();
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  // Filter out attempts older than 1 hour
  const recentAttempts = attempts.filter((a) => a.timestamp > oneHourAgo);

  // Add new attempt
  recentAttempts.push({ timestamp: now });

  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recentAttempts));
  localStorage.setItem(COOLDOWN_KEY, now.toString());
}

function getAttemptsInLastHour(): number {
  const attempts = getRateLimitData();
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return attempts.filter((a) => a.timestamp > oneHourAgo).length;
}

function getCooldownRemaining(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  const cooldownStart = localStorage.getItem(COOLDOWN_KEY);
  if (!cooldownStart) {
    return 0;
  }

  const elapsed = Date.now() - Number.parseInt(cooldownStart, 10);
  const remaining = COOLDOWN_SECONDS * 1000 - elapsed;

  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(
    getCooldownRemaining()
  );

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      const remaining = getCooldownRemaining();
      setCooldownSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      // Check rate limiting
      const attemptsInLastHour = getAttemptsInLastHour();
      if (attemptsInLastHour >= MAX_ATTEMPTS_PER_HOUR) {
        toast.error(
          `Too many attempts. Please try again later. (Max ${MAX_ATTEMPTS_PER_HOUR} per hour)`
        );
        return;
      }

      const cooldown = getCooldownRemaining();
      if (cooldown > 0) {
        toast.error(`Please wait ${cooldown} seconds before trying again.`);
        return;
      }

      setIsLoading(true);
      try {
        const result = await authClient.forgetPassword({
          email: value.email,
          redirectTo: "/reset-password",
        });

        // Add attempt to rate limit tracking
        addAttempt();
        setCooldownSeconds(COOLDOWN_SECONDS);

        if (result.error) {
          toast.error(result.error.message || "Failed to send reset email");
          setIsLoading(false);
        } else {
          toast.success(
            "If an account exists with this email, you'll receive a password reset link."
          );
          form.reset();
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Forgot password error:", error);
        toast.error("An error occurred. Please try again.");
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-normal text-2xl">
          Forgot your <span className="font-bold">password?</span>
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Enter your email and we'll send you a link to reset your password
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
          <form.Field name="email">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    aria-invalid={isInvalid}
                    autoComplete="email"
                    disabled={isLoading}
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
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
          disabled={
            isLoading ||
            form.state.isSubmitting ||
            cooldownSeconds > 0 ||
            getAttemptsInLastHour() >= MAX_ATTEMPTS_PER_HOUR
          }
          size="lg"
          type="submit"
        >
          {isLoading || form.state.isSubmitting ? (
            "Sending..."
          ) : cooldownSeconds > 0 ? (
            <span className="flex items-center gap-1.5">
              Wait{" "}
              <NumberFlow className="tabular-nums" value={cooldownSeconds} />s
            </span>
          ) : getAttemptsInLastHour() >= MAX_ATTEMPTS_PER_HOUR ? (
            "Too many attempts"
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      {cooldownSeconds > 0 && (
        <p className="flex items-center justify-center gap-1 text-center text-muted-foreground text-sm">
          Please wait{" "}
          <NumberFlow className="tabular-nums" value={cooldownSeconds} />{" "}
          seconds before trying again
        </p>
      )}

      {getAttemptsInLastHour() >= MAX_ATTEMPTS_PER_HOUR && (
        <p className="text-center text-destructive text-sm">
          Maximum attempts reached ({MAX_ATTEMPTS_PER_HOUR} per hour). Please
          try again later.
        </p>
      )}

      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          Remember your password?{" "}
          <Link
            className="text-card-foreground transition-all hover:text-primary"
            href="/signin"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

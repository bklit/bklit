"use client";

import { Button } from "@bklit/ui/components/button";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useStepper } from "@/app/(onboarding)/components/stepper";
import { useTRPC } from "@/trpc/react";

interface TestConnectionStepFormProps {
  organizationId: string;
  projectId: string;
  projectDomain: string;
}

export function TestConnectionStepForm({
  organizationId,
  projectId,
  projectDomain,
}: TestConnectionStepFormProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const { setIsConnected: setStepperConnected } = useStepper();
  const [isConnected, setIsConnected] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get pageview stats to check for connection
  const { refetch: refetchStats } = useQuery(
    trpc.pageview.getStats.queryOptions(
      {
        projectId,
        organizationId,
      },
      {
        enabled: false,
      }
    )
  );

  // Poll for connection every 3 seconds
  useEffect(() => {
    if (isConnected) return;

    const checkConnection = setInterval(async () => {
      const result = await refetchStats();
      if (result.data && result.data.totalViews > 0) {
        setIsConnected(true);
        setStepperConnected(true);
        clearInterval(checkConnection);
        toast.success("🎉 Connection detected! Redirecting to dashboard...", {
          duration: 5000,
        });

        // Wait 5 seconds then redirect
        setIsRedirecting(true);
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = setTimeout(() => {
          // Validate IDs before navigation
          if (!organizationId || organizationId.trim() === "") {
            toast.error(
              "Organization ID is missing. Cannot navigate to dashboard."
            );
            setIsRedirecting(false);
            return;
          }
          if (!projectId || projectId.trim() === "") {
            toast.error("Project ID is missing. Cannot navigate to dashboard.");
            setIsRedirecting(false);
            return;
          }

          router.push(`/${organizationId}/${projectId}?onboarding=new`);
        }, 5000);
      }
    }, 3000);

    return () => {
      clearInterval(checkConnection);
    };
  }, [
    isConnected,
    refetchStats,
    router,
    organizationId,
    projectId,
    setStepperConnected,
  ]);

  // Cleanup redirect timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  // Countdown timer when redirecting
  useEffect(() => {
    if (!isRedirecting) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isRedirecting]);

  const handleOpenWebsite = () => {
    window.open(projectDomain, "_blank", "noopener,noreferrer");
  };

  const handleSkip = () => {
    // Validate IDs before navigation
    if (!organizationId || organizationId.trim() === "") {
      toast.error("Organization ID is missing. Cannot navigate to dashboard.");
      return;
    }
    if (!projectId || projectId.trim() === "") {
      toast.error("Project ID is missing. Cannot navigate to dashboard.");
      return;
    }

    router.push(`/${organizationId}/${projectId}?onboarding=new`);
  };

  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center py-12">
        <NumberFlow
          className="font-bold text-6xl text-emerald-500"
          format={{ minimumIntegerDigits: 2 }}
          value={countdown}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button onClick={handleOpenWebsite} size="lg" variant="secondary">
          <ExternalLink size={16} /> Open your website
        </Button>
        <Button onClick={handleSkip} size="lg" variant="ghost">
          Skip
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-4">
        {isConnected ? (
          <>
            <svg
              aria-label="Connected"
              className="size-5 shrink-0 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Connected</title>
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            <span className="text-green-600 text-sm">Connected!</span>
          </>
        ) : (
          <>
            <svg
              aria-label="Loading"
              className="size-5 shrink-0 animate-spin text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
            >
              <title>Loading</title>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                fill="currentColor"
              />
            </svg>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">
                Waiting for connection...
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                Add the SDK to your website and refresh the page to start
                tracking.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export type { TestConnectionStepFormProps };

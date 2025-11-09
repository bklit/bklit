"use client";

import { Button } from "@bklit/ui/components/button";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
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
      },
    ),
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
          router.push(`/${organizationId}/${projectId}`);
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

  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center py-12">
        <NumberFlow
          value={countdown}
          format={{ minimumIntegerDigits: 2 }}
          className="text-6xl font-bold text-emerald-500"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button onClick={handleOpenWebsite} variant="secondary" size="lg">
          <ExternalLink size={16} /> Open your website
        </Button>
        <Button variant="ghost" size="lg" asChild>
          <Link href="/">Skip</Link>
        </Button>
      </div>

      <div className="flex items-center gap-2 p-4 border rounded-md bg-muted/50">
        {isConnected ? (
          <>
            <svg
              className="size-5 text-green-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-label="Connected"
            >
              <title>Connected</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm text-green-600">Connected!</span>
          </>
        ) : (
          <>
            <svg
              className="size-5 animate-spin text-muted-foreground shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading"
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
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Waiting for connection...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
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

"use client";

import { CodeBlockClient } from "@bklit/ui/components/code-block-client";
import { CopyInput } from "@bklit/ui/components/input-copy";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bklit/ui/components/popover";
import { useMutation } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/react";

interface SDKConnectionStepFormProps {
  organizationId: string;
  projectId: string;
  projectName: string;
  projectDomain: string;
  onTokenCreated?: (token: string) => void;
}

export function SDKConnectionStepForm({
  organizationId,
  projectId,
  projectName,
  projectDomain,
  onTokenCreated,
}: SDKConnectionStepFormProps) {
  const trpc = useTRPC();
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const hasCreatedToken = useRef(false);

  // Dumped this here, get's removed in production
  console.log("projectDomain", projectDomain);

  const getWsHost = () => {
    if (typeof window === "undefined") {
      return "ws://localhost:8080";
    }

    const { hostname } = window.location;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "ws://localhost:8080";
    }

    return "wss://bklit.ws";
  };

  const wsHost = getWsHost();

  // Auto-create API token on mount
  const createToken = useMutation(
    trpc.apiToken.create.mutationOptions({
      onSuccess: (data) => {
        if (!data.token) {
          toast.error("Token was created but could not be retrieved");
          return;
        }
        setCreatedToken(data.token);
        onTokenCreated?.(data.token);
        toast.success("API token generated! 🔑");
      },
      onError: (error) => {
        toast.error(`Failed to create token: ${error.message}`);
      },
    })
  );

  // Auto-create token on mount (only once)
  useEffect(() => {
    if (!(hasCreatedToken.current || createdToken || createToken.isPending)) {
      hasCreatedToken.current = true;
      createToken.mutate({
        organizationId,
        name: `${projectName} Token`,
        description: "Auto-generated during onboarding",
        projectIds: [projectId],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    createToken.isPending,
    createToken.mutate,
    createdToken,
    organizationId,
    projectId,
    projectName,
  ]); // Only run once on mount

  if (createToken.isPending || !createdToken) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <svg
            aria-label="Loading"
            className="size-5 animate-spin text-muted-foreground"
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
          <span className="text-muted-foreground text-sm">
            Creating API token...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-medium text-sm">Your API Token</h3>
        <p className="mb-4 text-muted-foreground text-xs">
          Copy this token - you won&apos;t be able to see it again!
        </p>
        <CopyInput value={createdToken} />
      </div>

      <div>
        <h3 className="mb-2 font-medium text-sm">Install the SDK</h3>
        <CodeBlockClient language="bash">{`npm install @bklit/sdk
# or
pnpm add @bklit/sdk`}</CodeBlockClient>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-2 font-medium text-sm">
          Initialize the SDK
          <Popover>
            <PopoverTrigger asChild>
              <Info className="cursor-pointer" size={16} />
            </PopoverTrigger>
            <PopoverContent align="center" side="top">
              <p className="text-muted-foreground text-sm">
                Add this to your application entry point.
              </p>
            </PopoverContent>
          </Popover>
        </h3>
        <CodeBlockClient
          footer={
            <>
              The SDK connects via WebSocket for real-time analytics and instant
              session tracking.
            </>
          }
          language="typescript"
          lineNumbers={false}
        >{`import { initBklit } from "@bklit/sdk";

initBklit({
  projectId: "${projectId}",
  apiKey: "${createdToken}",
  // Optional: defaults to wss://bklit.ws in production
  // wsHost: "${wsHost}",
});`}</CodeBlockClient>
      </div>
    </div>
  );
}

export type { SDKConnectionStepFormProps };

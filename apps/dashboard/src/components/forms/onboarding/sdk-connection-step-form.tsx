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
import { useEffect, useState } from "react";
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
  
  // Determine API host based on environment
  const apiHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
      ? "http://localhost:3000/api/track"
      : "https://app.bklit.com/api/track";

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
    }),
  );

  // Auto-create token on mount
  useEffect(() => {
    if (!createdToken && !createToken.isPending) {
      createToken.mutate({
        organizationId,
        name: `${projectName} Token`,
        description: "Auto-generated during onboarding",
        projectIds: [projectId],
      });
    }
  }, [organizationId, projectName, projectId, createdToken]);

  if (createToken.isPending || !createdToken) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <svg
            className="size-5 animate-spin text-muted-foreground"
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
          <span className="text-sm text-muted-foreground">
            Creating API token...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Your API Token</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Copy this token - you won&apos;t be able to see it again!
        </p>
        <CopyInput value={createdToken} />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Install the SDK</h3>
        <CodeBlockClient language="bash">{`npm install @bklit/sdk
# or
pnpm add @bklit/sdk`}</CodeBlockClient>
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
          Initialize the SDK
          <Popover>
            <PopoverTrigger asChild>
              <Info size={16} className="cursor-pointer" />
            </PopoverTrigger>
            <PopoverContent side="top" align="center">
              <p className="text-sm text-muted-foreground">
                Add this to your application entry point.
              </p>
            </PopoverContent>
          </Popover>
        </h3>
        <CodeBlockClient
          language="typescript"
          lineNumbers={false}
          footer={
            <>
              The SDK will automatically use the correct API endpoint based on
              your environment.
            </>
          }
        >{`import { initBklit } from "@bklit/sdk";

initBklit({
  projectId: "${projectId}",
  apiKey: "${createdToken}",
  apiHost: "${apiHost}",
});`}</CodeBlockClient>
      </div>
    </div>
  );
}

export type { SDKConnectionStepFormProps };

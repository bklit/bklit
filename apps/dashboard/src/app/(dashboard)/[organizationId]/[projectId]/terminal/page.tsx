import { Suspense } from "react";
import { TerminalClient } from "./terminal-client";

interface TerminalPageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
  }>;
}

export default async function TerminalPage({ params }: TerminalPageProps) {
  const { organizationId, projectId } = await params;

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-2xl font-bold">Event Pipeline Terminal</h1>
        <p className="text-muted-foreground text-sm">
          Real-time monitoring of analytics pipeline: Ingestion → Queue → Worker
          → ClickHouse → PubSub → WebSocket
        </p>
      </div>
      
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading terminal...</div>}>
        <TerminalClient projectId={projectId} organizationId={organizationId} />
      </Suspense>
    </div>
  );
}


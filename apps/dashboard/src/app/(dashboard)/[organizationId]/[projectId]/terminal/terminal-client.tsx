"use client";

import type { DebugLog } from "@bklit/redis";
import { Badge } from "@bklit/ui/components/badge";
import { Card } from "@bklit/ui/components/card";
import { Input } from "@bklit/ui/components/input";
import { ScrollArea } from "@bklit/ui/components/scroll-area";
import { useEffect, useRef, useState } from "react";

interface TerminalClientProps {
  projectId: string;
  organizationId: string;
}

const STAGE_COLORS: Record<string, string> = {
  ingestion: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  queue: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  worker: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  clickhouse: "bg-green-500/10 text-green-500 border-green-500/20",
  pubsub: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  websocket: "bg-pink-500/10 text-pink-500 border-pink-500/20",
};

const LEVEL_COLORS: Record<string, string> = {
  info: "text-foreground",
  warn: "text-yellow-500",
  error: "text-red-500",
};

export function TerminalClient({ projectId }: TerminalClientProps) {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/debug-stream?projectId=${projectId}`
    );

    eventSource.onmessage = (event) => {
      if (isPaused) {
        return;
      }

      try {
        const log: DebugLog = JSON.parse(event.data);
        setLogs((prev) => [...prev.slice(-499), log]); // Keep last 500 logs
      } catch (error) {
        console.error("Failed to parse log:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
    };

    return () => {
      eventSource.close();
    };
  }, [projectId, isPaused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const toggleStage = (stage: string) => {
    const newSelected = new Set(selectedStages);
    if (newSelected.has(stage)) {
      newSelected.delete(stage);
    } else {
      newSelected.add(stage);
    }
    setSelectedStages(newSelected);
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedStages.size > 0 && !selectedStages.has(log.stage)) {
      return false;
    }
    if (
      filter &&
      !JSON.stringify(log).toLowerCase().includes(filter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const stages = [
    "ingestion",
    "queue",
    "worker",
    "clickhouse",
    "pubsub",
    "websocket",
  ];

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {stages.map((stage) => (
              <Badge
                className={`cursor-pointer ${selectedStages.has(stage) ? STAGE_COLORS[stage] : ""}`}
                key={stage}
                onClick={() => toggleStage(stage)}
                variant={selectedStages.has(stage) ? "default" : "outline"}
              >
                {stage}
              </Badge>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <Input
              className="w-64"
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter logs..."
              value={filter}
            />

            <Badge
              className="cursor-pointer"
              onClick={() => setIsPaused(!isPaused)}
              variant="outline"
            >
              {isPaused ? "⏸ Paused" : "▶ Live"}
            </Badge>

            <Badge
              className="cursor-pointer"
              onClick={() => setAutoScroll(!autoScroll)}
              variant="outline"
            >
              {autoScroll ? "📜 Auto-scroll" : "🔒 Locked"}
            </Badge>

            <Badge
              className="cursor-pointer"
              onClick={() => setLogs([])}
              variant="outline"
            >
              🗑 Clear
            </Badge>
          </div>
        </div>

        <div className="mt-3 flex gap-4 text-muted-foreground text-sm">
          <span>Total: {logs.length}</span>
          <span>Filtered: {filteredLogs.length}</span>
        </div>
      </Card>

      {/* Logs Display */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-2 font-mono text-sm">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                {logs.length === 0
                  ? "Waiting for events..."
                  : "No logs match filter"}
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div
                  className={`border-l-2 py-1 pl-3 ${LEVEL_COLORS[log.level]}`}
                  key={idx}
                  style={{ borderLeftColor: getStageColor(log.stage) }}
                >
                  <div className="flex items-start gap-2">
                    <span className="min-w-[160px] text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}.
                      {new Date(log.timestamp).getMilliseconds()}
                    </span>

                    <Badge
                      className={`${STAGE_COLORS[log.stage]} min-w-[100px] justify-center`}
                      variant="outline"
                    >
                      {log.stage}
                    </Badge>

                    <span className="flex-1">{log.message}</span>

                    {log.duration && (
                      <span className="text-muted-foreground text-xs">
                        {log.duration}ms
                      </span>
                    )}
                  </div>

                  {Object.keys(log.data).length > 0 && (
                    <div className="mt-1 ml-[170px] text-muted-foreground text-xs">
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}

                  {log.eventId && (
                    <div className="ml-[170px] text-muted-foreground text-xs">
                      Event ID: {log.eventId}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    ingestion: "rgb(59, 130, 246)",
    queue: "rgb(168, 85, 247)",
    worker: "rgb(234, 179, 8)",
    clickhouse: "rgb(34, 197, 94)",
    pubsub: "rgb(251, 146, 60)",
    websocket: "rgb(236, 72, 153)",
  };
  return colors[stage] || "rgb(156, 163, 175)";
}

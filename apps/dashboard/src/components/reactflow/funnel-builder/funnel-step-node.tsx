"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Eye, MousePointerClick } from "lucide-react";
import { memo } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { cn } from "@/lib/utils";
import type { StepData } from "./funnel-builder";

interface FunnelStepNodeData {
  label: string;
  stepData?: StepData;
  isConfigured: boolean;
  isEditing?: boolean;
  isFirstNode?: boolean;
}

export const FunnelStepNode = memo(function FunnelStepNode({
  id,
  data,
}: NodeProps) {
  const nodeData = data as FunnelStepNodeData;
  const { stepData, isEditing, isFirstNode } = nodeData;

  const isPageview = stepData?.type === "pageview";

  return (
    <div
      className={cn(
        "relative min-w-[240px] max-w-[320px] rounded-xl border-2 bg-card p-4",
        "shadow-sm transition-all duration-200 hover:cursor-pointer hover:shadow-md active:cursor-grabbing",
        "group",
        isEditing ? "border-primary" : "border-border"
      )}
    >
      {!isFirstNode && (
        <Handle
          className="size-3 border-background bg-primary"
          position={Position.Left}
          type="target"
        />
      )}

      <div className="relative flex w-full flex-col items-center gap-3">
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-full bg-bklit-600",
            isPageview ? "text-purple-600" : "text-teal-500"
          )}
        >
          {isPageview ? <Eye size={16} /> : <MousePointerClick size={16} />}
        </span>

        <div className="block w-0 min-w-full truncate text-center font-medium text-sm">
          {stepData?.name || (
            <div className="truncate text-muted-foreground italic">
              Untitled
            </div>
          )}
        </div>

        {isPageview && (
          <Badge variant="code">{stepData?.url || "No URL set"}</Badge>
        )}

        {!isPageview && (
          <Badge variant="code">
            {stepData?.eventName || "No event selected"}
          </Badge>
        )}
      </div>

      <Handle
        className="size-2! border-background! bg-primary!"
        position={Position.Right}
        type="source"
      />
    </div>
  );
});

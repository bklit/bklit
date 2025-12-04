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
        "relative bg-card border-2 rounded-xl p-4 min-w-[240px] max-w-[320px]",
        "shadow-sm hover:shadow-md transition-all duration-200 hover:cursor-pointer active:cursor-grabbing",
        "group",
        isEditing ? "border-primary" : "border-border",
      )}
    >
      {!isFirstNode && (
        <Handle
          type="target"
          position={Position.Left}
          className="bg-primary border-background size-3"
        />
      )}

      <div className="flex flex-col w-full items-center gap-3 relative">
        <span
          className={cn(
            "flex items-center justify-center size-12 bg-bklit-600 rounded-full",
            isPageview ? "text-purple-600" : "text-teal-500",
          )}
        >
          {isPageview ? <Eye size={16} /> : <MousePointerClick size={16} />}
        </span>

        <div className="block text-sm font-medium w-0 min-w-full truncate text-center">
          {stepData?.name || (
            <div className="text-muted-foreground italic truncate">
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
        type="source"
        position={Position.Right}
        className="bg-primary! border-background! size-2!"
      />
    </div>
  );
});

"use client";

import { Button } from "@bklit/ui/components/button";
import { Globe, Settings, Trash2, Zap } from "lucide-react";
import { memo } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { cn } from "@/lib/utils";
import type { StepData } from "./funnel-builder";

interface FunnelStepNodeData {
  label: string;
  stepData?: StepData;
  onConfigure: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  isConfigured: boolean;
  isEditing?: boolean;
  isFirstNode?: boolean;
}

export const FunnelStepNode = memo(function FunnelStepNode({
  id,
  data,
}: NodeProps) {
  const nodeData = data as FunnelStepNodeData;
  const { stepData, onConfigure, onDelete, isEditing, isFirstNode } = nodeData;

  const isPageview = stepData?.type === "pageview";

  return (
    <div
      className={cn(
        "relative bg-card border-2 rounded-xl p-4 min-w-[220px]",
        "shadow-sm hover:shadow-md transition-all duration-200",
        "group",
        isEditing ? "border-blue-500" : "border-border",
      )}
    >
      {!isFirstNode && (
        <Handle
          type="target"
          position={Position.Left}
          className="bg-primary border-background size-3"
        />
      )}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            isPageview ? "bg-blue-500/10" : "bg-amber-500/10",
          )}
        >
          {isPageview ? (
            <Globe className="w-5 h-5 text-blue-500" />
          ) : (
            <Zap className="w-5 h-5 text-amber-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded",
                isPageview
                  ? "bg-blue-500/10 text-blue-600"
                  : "bg-amber-500/10 text-amber-600",
              )}
            >
              {isPageview ? "Pageview" : "Event"}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigure(id);
                }}
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <p className="font-semibold text-foreground mt-2 truncate">
            {stepData?.name || (
              <span className="text-muted-foreground italic">Untitled</span>
            )}
          </p>

          {isPageview && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {stepData?.url || <span className="italic">No URL set</span>}
            </p>
          )}

          {!isPageview && (
            <code className="text-xs text-muted-foreground mt-1 block font-mono bg-muted px-1.5 py-0.5 rounded truncate">
              {stepData?.eventName || (
                <span className="italic">No event selected</span>
              )}
            </code>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-primary !border-background !w-3 !h-3"
      />
    </div>
  );
});

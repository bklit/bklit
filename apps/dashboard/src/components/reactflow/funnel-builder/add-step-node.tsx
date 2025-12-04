"use client";

import { Plus } from "lucide-react";
import { memo } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { cn } from "@/lib/utils";

interface AddStepNodeData {
  label: string;
  onConfigure: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  isConfigured: boolean;
  isEditing?: boolean;
  isFirstNode?: boolean;
}

export const AddStepNode = memo(function AddStepNode({ id, data }: NodeProps) {
  const nodeData = data as AddStepNodeData;
  const { isEditing, isFirstNode } = nodeData;

  return (
    <button
      className={cn(
        "relative bg-card border-2 border-dashed rounded-xl p-6",
        "hover:border-primary hover:bg-secondary/50 transition-all duration-200",
        "cursor-pointer min-w-[200px] group",
        isEditing ? "border-blue-500 border-solid" : "border-primary/40",
      )}
      onClick={() => nodeData.onConfigure(id)}
      type="button"
    >
      {!isFirstNode && (
        <Handle
          type="target"
          position={Position.Left}
          className="bg-primary border-background size-3"
        />
      )}

      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Plus className="w-6 h-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">Add Step</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click to configure
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="bg-primary border-background size-3"
      />
    </button>
  );
});

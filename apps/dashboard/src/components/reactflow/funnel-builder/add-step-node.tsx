"use client";

import { Badge } from "@bklit/ui/components/badge";
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
        "relative min-w-[240px] max-w-[320px] rounded-xl border-2 border-primary border-dashed bg-card p-4",
        "shadow-sm transition-all duration-200 hover:cursor-pointer hover:shadow-md active:cursor-grabbing",
        "group",
        isEditing && "border-solid"
      )}
      onClick={() => nodeData.onConfigure(id)}
      type="button"
    >
      {!isFirstNode && (
        <Handle
          className="size-3 border-background bg-primary"
          position={Position.Left}
          type="target"
        />
      )}

      <div className="relative flex w-full flex-col items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-bklit-600 text-primary">
          <Plus size={16} />
        </span>

        <div className="block w-0 min-w-full truncate text-center font-medium text-sm">
          Add Step
        </div>

        <Badge variant="code">Pageview or Event</Badge>
      </div>

      {!isFirstNode && (
        <Handle
          className="size-3 border-background bg-primary"
          position={Position.Right}
          type="source"
        />
      )}
    </button>
  );
});

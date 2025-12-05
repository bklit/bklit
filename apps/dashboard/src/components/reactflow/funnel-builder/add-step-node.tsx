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
        "relative bg-card border-2 rounded-xl border-dashed border-primary p-4 min-w-[240px] max-w-[320px]",
        "shadow-sm hover:shadow-md transition-all duration-200 hover:cursor-pointer active:cursor-grabbing",
        "group",
        isEditing && "border-solid",
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

      <div className="flex flex-col w-full items-center gap-3 relative">
        <span className="flex items-center justify-center size-12 bg-bklit-600 text-primary rounded-full">
          <Plus size={16} />
        </span>

        <div className="block text-sm font-medium w-0 min-w-full truncate text-center">
          Add Step
        </div>

        <Badge variant="code">Pageview or Event</Badge>
      </div>

      {!isFirstNode && (
        <Handle
          type="source"
          position={Position.Right}
          className="bg-primary border-background size-3"
        />
      )}
    </button>
  );
});

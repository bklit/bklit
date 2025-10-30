"use client";

import { Button } from "@bklit/ui/components/button";
import { ButtonGroup } from "@bklit/ui/components/button-group";
import { Input } from "@bklit/ui/components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bklit/ui/components/tooltip";
import { Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CopyInputProps {
  value: string;
  className?: string;
}

export function CopyInput({ value, className }: CopyInputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <ButtonGroup className={cn("w-full", className)}>
      <Input value={value} readOnly disabled className="font-mono" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Copy"
            variant="outline"
            onClick={handleCopy}
            onMouseEnter={() => setCopied(false)}
            type="button"
          >
            <Copy className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {copied ? "Copied!" : "Copy to clipboard"}
        </TooltipContent>
      </Tooltip>
    </ButtonGroup>
  );
}

"use client";

import { Button } from "@bklit/ui/components/button";
import { ButtonGroup } from "@bklit/ui/components/button-group";
import { Input } from "@bklit/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bklit/ui/components/popover";
import { cn } from "@bklit/ui/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface CopyInputProps {
  value: string;
  className?: string;
  readOnly?: boolean;
}

type CopyState = "idle" | "success";

export function CopyInput({
  value,
  className,
  readOnly = true,
  ...props
}: React.ComponentProps<"input"> & CopyInputProps) {
  const [state, setState] = useState<CopyState>("idle");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("success");
      setTimeout(() => {
        setPopoverOpen(true);
        setTimeout(() => setPopoverOpen(false), 1500);
      }, 180);
    } catch (err) {
      console.error("Failed to copy:", err);
      setState("idle");
    }
  };

  return (
    <ButtonGroup className={cn("w-full", className)}>
      <Input
        className="font-mono"
        readOnly={readOnly}
        value={value}
        {...props}
      />
      <Popover onOpenChange={setPopoverOpen} open={popoverOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-label="Copy"
            className="relative size-12 cursor-pointer overflow-hidden"
            onClick={handleCopy}
            onMouseEnter={() => setState("idle")}
            type="button"
            variant="outline"
          >
            <div className="relative flex size-4 items-center justify-center">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate={{
                    scale: 1,
                    filter: "blur(0px)",
                    opacity: 1,
                  }}
                  className="absolute"
                  exit={{
                    scale: 0.5,
                    filter: "blur(6px)",
                    opacity: 0,
                  }}
                  initial={{
                    scale: 0.5,
                    filter: "blur(6px)",
                    opacity: 0,
                  }}
                  key={state}
                  transition={{
                    duration: 0.15,
                    ease: "easeInOut",
                  }}
                >
                  {state === "idle" && <CopyIcon />}
                  {state === "success" && (
                    <CheckIcon onComplete={() => setState("idle")} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-max p-2 px-3 text-xs" side="top">
          Copied to clipboard
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  );
}

function CopyIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <title>Copy</title>
      <rect height="14" rx="2" ry="2" width="14" x="8" y="8" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ onComplete }: { onComplete: () => void }) {
  return (
    <svg
      className="text-emerald-500"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <title>Copied</title>
      <motion.polyline
        animate={{ pathLength: [0, 1, 1, 1] }}
        initial={{ pathLength: 0 }}
        onAnimationComplete={onComplete}
        points="4 12 9 17 20 6"
        transition={{
          duration: 1,
          ease: "easeInOut",
          times: [0, 0.2, 0.8, 1],
        }}
      />
    </svg>
  );
}

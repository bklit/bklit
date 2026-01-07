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
        value={value}
        readOnly={readOnly}
        className="font-mono"
        {...props}
      />
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-label="Copy"
            variant="outline"
            onClick={handleCopy}
            onMouseEnter={() => setState("idle")}
            type="button"
            className="size-12 cursor-pointer relative overflow-hidden"
          >
            <div className="relative size-4 flex items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={state}
                  className="absolute"
                  initial={{
                    scale: 0.5,
                    filter: "blur(6px)",
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    filter: "blur(0px)",
                    opacity: 1,
                  }}
                  exit={{
                    scale: 0.5,
                    filter: "blur(6px)",
                    opacity: 0,
                  }}
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
        <PopoverContent side="top" className="w-max p-2 px-3 text-xs">
          Copied to clipboard
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  );
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Copy</title>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ onComplete }: { onComplete: () => void }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-500"
    >
      <title>Copied</title>
      <motion.polyline
        points="4 12 9 17 20 6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 1, 1] }}
        transition={{
          duration: 1,
          ease: "easeInOut",
          times: [0, 0.2, 0.8, 1],
        }}
        onAnimationComplete={onComplete}
      />
    </svg>
  );
}

"use client";

import { Button } from "@bklit/ui/components/button";
import { Input } from "@bklit/ui/components/input";
import { Label } from "@bklit/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bklit/ui/components/sheet";

import { cn } from "@bklit/ui/lib/utils";
// import type { StepData, StepType } from "./funnel-builder";

export function FunnelSettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Funnel Settings</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}

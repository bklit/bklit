"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

interface FunnelSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnelId: string;
  funnelName: string;
  organizationId: string;
  projectId: string;
  onContinueAdding: () => void;
}

export function FunnelSuccessDialog({
  open,
  onOpenChange,
  funnelId,
  funnelName,
  organizationId,
  projectId,
  onContinueAdding,
}: FunnelSuccessDialogProps) {
  const handleContinueAdding = () => {
    onContinueAdding();
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <CheckCircle className="mb-2 size-12 text-green-500" />
          <DialogTitle className="font-bold text-2xl">
            Funnel Created
          </DialogTitle>
          <DialogDescription className="mt-2 text-center text-muted-foreground">
            Your funnel <strong>&quot;{funnelName}&quot;</strong> has been
            successfully created.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            onClick={handleContinueAdding}
            type="button"
            variant="outline"
          >
            Continue Adding Another Funnel
          </Button>
          <Button asChild className="w-full sm:w-auto" type="button">
            <Link
              href={`/${organizationId}/${projectId}/funnels/${funnelId}`}
              onClick={() => onOpenChange(false)}
            >
              Go to Funnel
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

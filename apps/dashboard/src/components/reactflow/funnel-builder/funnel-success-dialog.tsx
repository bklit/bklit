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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <CheckCircle className="size-12 text-green-500 mb-2" />
          <DialogTitle className="text-2xl font-bold">
            Funnel Created
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-center mt-2">
            Your funnel <strong>&quot;{funnelName}&quot;</strong> has been
            successfully created.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleContinueAdding}
            className="w-full sm:w-auto"
          >
            Continue Adding Another Funnel
          </Button>
          <Button type="button" asChild className="w-full sm:w-auto">
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

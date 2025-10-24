"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { Spinner } from "@bklit/ui/components/spinner";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/workspace-provider";

interface BillingSuccessDialogProps {
  isOpenInitially: boolean;
}

export function BillingSuccessDialog({
  isOpenInitially,
}: BillingSuccessDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const router = useRouter();
  const { activeOrganization } = useWorkspace();
  const [, setPurchase] = useQueryState("purchase");

  // Detect when plan updates and auto-close dialog
  useEffect(() => {
    if (isProcessing && activeOrganization?.plan === "pro") {
      // Plan has been updated to pro, close the dialog
      setIsProcessing(false);
      setTimeout(() => {
        setIsOpen(false);
        // Remove the purchase parameter from URL
        setPurchase(null);
      }, 2000); // Show success message for 2 seconds before closing
    }
  }, [activeOrganization?.plan, isProcessing, setPurchase]);

  useEffect(() => {
    if (isOpenInitially) {
      setIsOpen(true);

      // Poll for database changes by refreshing the page
      const pollInterval = setInterval(() => {
        router.refresh();
      }, 3000);

      // Stop polling after 60 seconds
      const stopPolling = setTimeout(() => {
        clearInterval(pollInterval);
        setIsProcessing(false);
      }, 20000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(stopPolling);
      };
    }
  }, [isOpenInitially, router]);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          {isProcessing ? (
            <Spinner className="size-6" />
          ) : (
            <CheckCircle className="size-6" />
          )}
          <DialogTitle className="text-2xl font-bold">
            {isProcessing ? "Updating your plan..." : "Success"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isProcessing ? (
              <div className="space-y-2 text-center">
                <div>Your plan is being automatically updated.</div>
                <div>This could take up to 30 seconds to complete.</div>
              </div>
            ) : (
              <div className="space-y-2 text-center">
                <div>
                  Your plan has been successfully updated. Thank you for your
                  purchase!
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-center">
          <Button
            onClick={() => {
              setIsOpen(false);
              setPurchase(null);
            }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { BklitLogo } from "@bklit/ui/icons/bklit";
import { Bell } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";

export function WelcomeModal() {
  const [onboarding, setOnboarding] = useQueryState(
    "onboarding",
    parseAsString
  );
  const open = onboarding === "new";

  const handleClose = () => {
    setOnboarding(null);
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-4 text-center">
          <div className="mx-auto">
            <BklitLogo className="text-black dark:text-white" size={48} />
          </div>
          <DialogTitle className="text-center text-2xl">
            Welcome to <b className="font-bold">Bklit</b>
          </DialogTitle>
          <DialogDescription className="space-y-3 text-center text-base">
            <p className="font-medium text-muted-foreground">
              We've invited you to our demo project so you can explore Bklit's
              features with real data.
            </p>
            <p>
              Click the bell icon
              <div className="relative mx-2 inline-flex items-center justify-center">
                <Bell className="inline-flex size-4 text-card-foreground dark:text-white" />{" "}
                <span className="absolute -top-1 -right-1 size-1 rounded-full bg-primary" />
              </div>
              in the header to see your notifications and{" "}
              <b>accept the invitation</b>.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleClose} size="lg">
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

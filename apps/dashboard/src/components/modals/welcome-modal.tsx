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
    parseAsString,
  );
  const open = onboarding === "new";

  const handleClose = () => {
    setOnboarding(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto">
            <BklitLogo size={48} className="dark:text-white text-black" />
          </div>
          <DialogTitle className="text-2xl text-center">
            Welcome to <b className="font-bold">Bklit</b>
          </DialogTitle>
          <DialogDescription className="text-base space-y-3 text-center">
            <p className="text-muted-foreground font-medium">
              We've invited you to our demo project so you can explore Bklit's
              features with real data.
            </p>
            <p>
              Click the bell icon
              <div className="inline-flex items-center justify-center relative mx-2">
                <Bell className="size-4 inline-flex text-card-foreground dark:text-white" />{" "}
                <span className="bg-primary size-1 rounded-full absolute -top-1 -right-1"></span>
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

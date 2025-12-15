'use client';

import { Button } from "@bklit/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { Info } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";

export function DemoProjectModal() {
  const [demo, setDemo] = useQueryState('demo', parseAsBoolean);
  const open = demo === true;
  
  const handleClose = () => {
    setDemo(null);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto size-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Info className="size-6 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-xl">
            This is a Demo Project
          </DialogTitle>
          <DialogDescription className="text-base space-y-2">
            <p>
              All the data you see here is collected from our live playground at{" "}
              <a 
                href="https://playground.bklit.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                playground.bklit.com
              </a>
            </p>
            <p>
              Explore the dashboard, check out the analytics, and see what Bklit can do for your projects!
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleClose} size="lg">
            Start Exploring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


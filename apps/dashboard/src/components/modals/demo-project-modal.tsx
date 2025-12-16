"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { parseAsBoolean, useQueryState } from "nuqs";

export function DemoProjectModal() {
  const [demo, setDemo] = useQueryState("demo", parseAsBoolean);
  const open = demo === true;

  const handleClose = () => {
    setDemo(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative text-center space-y-3 w-[calc(100%+4.5rem)] -mx-9 -mt-9 rounded-t-xl aspect-1000/560 p-9 flex flex-col items-center justify-end">
          <div className="absolute top-0 left-0 w-full aspect-1000/560 rounded-t-xl overflow-hidden">
            <Image
              src="/playground.jpg"
              alt="Playground"
              width={1000}
              height={560}
            />
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-transparent from-50% to-background rounded-t-xl" />
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-r from-transparent to-background/50 rounded-t-xl" />
          </div>
          <DialogTitle className="z-10 flex items-center justify-center gap-2">
            <BklitLogo size={48} className="dark:text-white text-black" />
            <span className="text-2xl font-bold">Bklit Demo</span>
          </DialogTitle>
        </DialogHeader>
        <div className="text-base space-y-3 text-center text-muted-foreground pt-4">
          <p>
            All the data you see here is collected from our live playground at{" "}
            <a
              href="https://playground.bklit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              playground.bklit.com
            </a>
          </p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button variant="ghost" size="lg" asChild>
            <a
              href="https://playground.bklit.com/?utm_source=dashboard&utm_medium=referral&utm_campaign=demo-project-modal"
              target="_blank"
              rel="noopener noreferrer"
            >
              Playground
              <ExternalLink className="size-4" />
            </a>
          </Button>
          <Button onClick={handleClose} size="lg">
            Start Exploring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

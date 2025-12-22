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
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative -mx-9 -mt-9 flex aspect-1000/560 w-[calc(100%+4.5rem)] flex-col items-center justify-end space-y-3 rounded-t-xl p-9 text-center">
          <div className="absolute top-0 left-0 aspect-1000/560 w-full overflow-hidden rounded-t-xl">
            <Image
              alt="Playground"
              height={560}
              src="/playground.jpg"
              width={1000}
            />
            <div className="absolute top-0 left-0 h-full w-full rounded-t-xl bg-linear-to-b from-50% from-transparent to-background" />
            <div className="absolute top-0 left-0 h-full w-full rounded-t-xl bg-linear-to-r from-transparent to-background/50" />
          </div>
          <DialogTitle className="z-10 flex items-center justify-center gap-2">
            <BklitLogo className="text-black dark:text-white" size={48} />
            <span className="font-bold text-2xl">Bklit Demo</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-4 text-center text-base text-muted-foreground">
          <p>
            All the data you see here is collected from our live playground at{" "}
            <a
              className="text-foreground hover:underline"
              href="https://playground.bklit.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              playground.bklit.com
            </a>
          </p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button asChild size="lg" variant="ghost">
            <a
              href="https://playground.bklit.com/?utm_source=dashboard&utm_medium=referral&utm_campaign=demo-project-modal"
              rel="noopener noreferrer"
              target="_blank"
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

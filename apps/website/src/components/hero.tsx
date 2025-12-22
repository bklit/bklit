"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bklit/ui/components/dialog";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import { Play } from "lucide-react";
import { useRef, useState } from "react";

export const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePlayEvent = () => {
    setIsPlaying(true);
  };

  const handlePauseEvent = () => {
    setIsPlaying(false);
  };
  return (
    <div className="container mx-auto flex max-w-6xl flex-col px-4">
      <div className="flex w-full flex-col items-center justify-center space-y-6 pt-26 text-center sm:pt-48">
        <div className="squircle hidden aspect-square w-36 items-center justify-center rounded-4xl bg-radial-[at_25%_25%] from-lime-200 to-emerald-500 sm:flex sm:rounded-[300px]">
          <BklitLogo size={90} variant="color" />
        </div>
        <h1 className="from-amber-100 to-emerald-100 font-regular text-3xl leading-tight md:text-6xl dark:bg-linear-to-b dark:bg-clip-text dark:text-transparent">
          Analytics for everyone
        </h1>
        <p className="font-medium text-xl dark:text-shadow-sm dark:text-white">
          Track everything with 4 lines of code
        </p>

        <div className="flex items-center justify-center">
          <Dialog onOpenChange={setIsPlaying} open={isPlaying}>
            <DialogTrigger asChild>
              <button
                className="squircle z-10 flex size-18 cursor-pointer items-center justify-center rounded-3xl bg-radial-[at_25%_25%] from-lime-200 to-emerald-500 shadow-xl transition-all duration-300 hover:scale-110 sm:rounded-[300px]"
                onClick={handlePlay}
                type="button"
              >
                <Play className="text-black" size={32} strokeWidth={1.5} />
              </button>
            </DialogTrigger>
            <DialogContent className="aspect-video min-w-5xl border-t-0 p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>Bklit Demo</DialogTitle>
              </DialogHeader>
              <video
                autoPlay
                className="h-full w-full object-cover"
                loop
                muted
                onPause={handlePauseEvent}
                onPlay={handlePlayEvent}
                ref={videoRef}
                src="/demo.mp4"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

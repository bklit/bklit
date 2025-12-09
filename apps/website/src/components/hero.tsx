"use client";

import { Button } from "@bklit/ui/components/button";
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
    <div className="container mx-auto max-w-6xl flex flex-col px-4">
      <div className="flex flex-col items-center justify-center text-center w-full space-y-6 pt-26 sm:pt-48">
        <div className="hidden sm:flex items-center justify-center w-36 aspect-square bg-radial-[at_25%_25%] from-lime-200 to-emerald-500 rounded-4xl sm:rounded-[300px] squircle">
          <BklitLogo size={90} variant="dark" />
        </div>
        <h1 className="text-3xl md:text-6xl font-regular leading-tight dark:bg-clip-text dark:text-transparent dark:bg-linear-to-b from-amber-100 to-emerald-100">
          Analytics for everyone
        </h1>
        <p className="text-xl dark:text-white dark:text-shadow-sm">
          Track everything with 3 lines of code.
        </p>

        <div className="flex items-center justify-center">
          <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
            <DialogTrigger asChild>
              <button
                type="button"
                onClick={handlePlay}
                className="flex items-center justify-center cursor-pointer size-18 bg-radial-[at_25%_25%] from-lime-200 to-emerald-500 rounded-3xl sm:rounded-[300px] squircle transition-all duration-300 z-10 shadow-xl hover:scale-110"
              >
                <Play
                  size={32}
                  strokeWidth={1.5}
                  className="text-primary-foreground"
                />
              </button>
            </DialogTrigger>
            <DialogContent className="p-0 min-w-5xl aspect-video border-t-0">
              <DialogHeader className="sr-only">
                <DialogTitle>Bklit Demo</DialogTitle>
              </DialogHeader>
              <video
                ref={videoRef}
                src="/demo.mp4"
                autoPlay
                muted
                loop
                className="w-full h-full object-cover"
                onPlay={handlePlayEvent}
                onPause={handlePauseEvent}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

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
import { Github, Play } from "lucide-react";
import { useRef, useState } from "react";
import { GithubStarCount } from "./github-star-count";

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
      <div className="flex flex-col items-center justify-center text-center w-full space-y-6 py-26 pt-26 md:pt-48">
        <div className="flex items-center justify-center w-36 aspect-square bg-radial-[at_25%_25%] from-lime-200 to-emerald-500 rounded-[300px] squircle">
          <BklitLogo size={90} variant="dark" />
        </div>
        <h1 className="text-4xl md:text-6xl font-regular leading-tight dark:bg-clip-text dark:text-transparent dark:bg-linear-to-b from-amber-100 to-emerald-100">
          Analytics for everyone
        </h1>
        <p className="text-xl text-muted-foreground">
          Track everything with 3 lines of code.
        </p>
        <div className="flex items-center gap-6">
          <Button size="lg" asChild className="shadow-xl">
            <a
              href="https://app.bklit.com/signin"
              target="_blank"
              title="Bklit Demo Dashboard"
              rel="noopener noreferrer"
            >
              Get started
            </a>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            asChild
            className="group flex items-center gap-3 shadow-xl"
          >
            <a
              href="https://github.com/bklit/bklit"
              target="_blank"
              title="Bklit on Github"
              rel="noopener noreferrer"
            >
              <Github size={16} /> Github
              <span className="flex items-center gap-1 group-hover:opacity-100 opacity-70 transition-opacity">
                <GithubStarCount />
              </span>
            </a>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
          <DialogTrigger asChild>
            <button
              type="button"
              onClick={handlePlay}
              className="flex items-center justify-center cursor-pointer size-24 bg-radial-[at_25%_25%] from-lime-200 to-emerald-500 rounded-[300px] squircle transition-all duration-300 z-10 shadow-xl hover:scale-110"
            >
              <Play
                size={48}
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
  );
};

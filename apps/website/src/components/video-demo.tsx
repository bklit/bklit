"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";

export function VideoDemo() {
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
    <div className="container mx-auto max-w-6xl px-4 relative overflow-hidden">
      <div className="perspective-normal">
        <div className="translate-y-0 rotate-x-5">
          <video
            ref={videoRef}
            src="/demo.mp4"
            muted
            loop
            className="w-full h-full object-cover rounded-4xl"
            onPlay={handlePlayEvent}
            onPause={handlePauseEvent}
          />
        </div>
      </div>
      {!isPlaying && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer size-32 bg-primary/50 backdrop-blur-sm rounded-full hover:bg-primary/70 transition-all duration-300"
        >
          <Play
            size={48}
            strokeWidth={1.5}
            className="text-primary-foreground"
          />
        </button>
      )}
      <div className="absolute top-0 left-0 w-full h-full from-transparent to-background via-transparent bg-linear-to-b pointer-events-none" />
    </div>
  );
}

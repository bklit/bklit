import { Button } from "@bklit/ui/components/button";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import { Github } from "lucide-react";
import { GithubStarCount } from "./github-star-count";

export const Hero = () => {
  return (
    <div className="container mx-auto max-w-6xl flex flex-col px-4">
      <div className="py-26 pt-26 md:pt-36">
        <div className="flex flex-col items-center justify-center text-center w-full py-10 space-y-6">
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
      </div>
    </div>
  );
};

import { Button } from "@bklit/ui/components/button";
import { ButtonGroup } from "@bklit/ui/components/button-group";
import { Github } from "lucide-react";
import { GithubStarCount } from "./github-star-count";

export const Hero = () => {
  return (
    <div className="container mx-auto max-w-6xl flex flex-col px-4">
      <div className="grid grid-cols-1 grid-rows-1">
        <div className="grid grid-cols-1 grid-rows-1 col-span-1 col-start-1 row-start-1">
          <div className="col-start-1 row-start-1 w-full flex justify-end">
            <img src="/diamond.svg" alt="Bklit" className="w-4/5" />
          </div>
          <div className="col-start-1 row-start-1 bg-linear-to-b from-transparent to-background" />
        </div>
        <div className="col-span-1 col-start-1 row-start-1 py-26 pt-36">
          <div className="grid grid-cols-2 w-full">
            <div className="py-10 space-y-6 max-w-2xl col-span-2 lg:col-span-1">
              <h1 className="text-6xl font-bold leading-tight bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                Analytics for developers who build at scale
              </h1>
              <p className="font-mono text-lg">
                Join the companies that use our open-source analytics to track
                what matters, understand customers, experiment faster, and turn
                data into growth.
              </p>
              <div className="flex items-center gap-2">
                <ButtonGroup>
                  <Button variant="mono" size="lg" asChild>
                    <a
                      href="https://app.bklit.com/signin"
                      target="_blank"
                      title="Bklit Demo Dashboard"
                      rel="noopener noreferrer"
                    >
                      Dashboard
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="group flex items-center gap-3"
                  >
                    <a
                      href="https://github.com/bklit/bklit"
                      target="_blank"
                      title="Bklit on Github"
                      rel="noopener noreferrer"
                    >
                      <Github size={16} /> OpenSource
                      <span className="flex items-center gap-1 group-hover:opacity-100 opacity-70 transition-opacity">
                        <GithubStarCount />
                      </span>
                    </a>
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

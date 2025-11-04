"use client";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bklit/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bklit/ui/components/tooltip";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import { Github } from "lucide-react";
import Link from "next/link";
import { useGithubStats } from "./providers/github-stats-provider";

export const PageHeader = () => {
  const { data, isLoading } = useGithubStats();

  return (
    <header className="w-full flex p-3 py-5 md:py-3">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-start gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer">
                  <BklitLogo size={38} className="dark:text-white text-black" />
                  <span className="text-2xl font-bold">Bklit</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Copy SVG</DropdownMenuItem>
                <DropdownMenuItem>Copy React</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Download Zip</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant="secondary" className="opacity-70 hover:opacity-100">
              Beta
            </Badge>
          </div>
          <nav className="p-4 hidden md:block">
            <ul className="flex items-center gap-2">
              <li>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" asChild disabled>
                      <Link href="/">Product</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </li>
              <li>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" asChild disabled>
                      <Link href="/">Resources</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </li>
              <li>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" asChild disabled>
                      <Link href="/">Pricing</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </li>
              <li>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" asChild disabled>
                      <Link href="/">Docs</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </li>
            </ul>
          </nav>

          <nav>
            <ul className="flex items-center gap-2">
              <li>
                <Button size="lg" variant="ghost" asChild>
                  <a
                    href={data?.html_url}
                    target="_blank"
                    className="flex items-center gap-2"
                  >
                    <Github size={16} />
                    <span className="font-bold">
                      {isLoading ? "..." : data?.stargazers_count}
                    </span>
                  </a>
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

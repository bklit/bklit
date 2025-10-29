"use client";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import { Separator } from "@bklit/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bklit/ui/components/tooltip";
import { Github } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./logo";

interface Repo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  ssh_url: string;
  stargazers_count: number;
  watchers_count: number;
  open_issues_count: number;
  forks_count: number;
}

export const PageHeader = () => {
  const [data, setData] = useState<Repo | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch repository data
        const repoResponse = await fetch(
          "https://api.github.com/repos/bklit/bklit",
        );
        const repoData = await repoResponse.json();
        setData(repoData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <header className="w-full flex p-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Logo height={32} />
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="secondary">Beta</Badge>
          </div>
          <nav className="p-4">
            <ul className="flex items-center gap-2">
              <li>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" asChild disabled>
                      <Link href="/">Features</Link>
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
                      <Link href="/">Contact</Link>
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
                    <span>{isLoading ? "..." : data?.stargazers_count}</span>
                  </a>
                </Button>
              </li>
              <li>
                <Button size="lg" variant="default" asChild>
                  <Link href="https://app.bklit.com/">Sign in</Link>
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

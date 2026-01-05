import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { DiscordIcon } from "@bklit/ui/icons/discord";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { XIcon } from "@bklit/ui/icons/x";
import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { GithubStarCount } from "@/components/github-star-count";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Bklit Branding",
  description: "Download the Bklit branding assets",
};

export default function BrandingPage() {
  return (
    <>
      <PageHeader />
      <div className="container mx-auto max-w-6xl py-48 space-y-16 px-4">
        <SectionHeader title="Contact" description="Contact the Bklit team">
          <Button variant="outline" asChild size="lg">
            <a
              href="https://www.linkedin.com/company/bklit/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </Button>
        </SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Sales</CardTitle>
                <CardDescription>Contact the Bklit.com sales</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="lg" variant="mono">
                  <a href="mailto:matt@bklit.com">Email Sales</a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Support</CardTitle>
                <CardDescription>
                  The light version of the Bklit logo &amp; wordmark.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" asChild variant="mono">
                  <a href="mailto:support@bklit.com">Email Support</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center gap-8">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Follow the community...
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="lg" asChild>
              <a
                href="https://discord.gg/9yyK8FwPcU"
                target="_blank"
                rel="noopener noreferrer"
              >
                <DiscordIcon className="size-4" />
                Discord
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href="https://x.com/bklitai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <XIcon className="size-4" />
                .com
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href="https://github.com/bklit/bklit"
                target="_blank"
                title="Bklit on Github"
                rel="noopener noreferrer"
              >
                <GitHubIcon className="size-4" /> Github
                <span className="flex items-center gap-1 group-hover:opacity-100 opacity-70 transition-opacity">
                  <GithubStarCount />
                </span>
              </a>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

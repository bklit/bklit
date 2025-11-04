import { Button } from "@bklit/ui/components/button";
import { ButtonGroup } from "@bklit/ui/components/button-group";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import {
  Activity,
  Blend,
  Clapperboard,
  Cone,
  FlagTriangleRight,
  Github,
  MousePointer2,
} from "lucide-react";
import { CardDecorator } from "@/components/card-decorator";
import { GithubStarCount } from "@/components/github-star-count";
import { PageHeader } from "@/components/page-header";
import { PolarPricingTable } from "@/components/polar-pricing-table";

export default function MarketingHomePage() {
  return (
    <main className="w-full min-h-screen bklit-hero flex flex-col gap-32">
      <PageHeader />
      <div className="container mx-auto max-w-6xl flex flex-col px-4">
        <div className="flex items-center justify-start w-full min-h-[600px]">
          <div className="py-10 space-y-6 max-w-2xl">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
              Understand your{" "}
              <span className="font-serif font-normal italic">application</span>
            </h1>
            <p className="font-mono text-lg">
              Real-time analytics, funnel analysis, custom event triggers,
              sessions, acquisitions and much more.
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
                    Demo
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
      <div className="w-full border-t border-b border-bklit-600">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-bklit-600 px-px">
            <div className="col-span-1 bg-background flex items-center justify-center p-8">
              <img src="/nextjs.svg" alt="Next.js" />
            </div>
            <div className="col-span-1 bg-background flex items-center justify-center p-8">
              <img src="/supabase.svg" alt="Next.js" />
            </div>
            <div className="col-span-1 bg-background flex items-center justify-center p-8">
              <img src="/turborepo.svg" alt="Next.js" />
            </div>
            <div className="col-span-1 bg-background flex items-center justify-center p-8">
              <img src="/polar.svg" alt="Next.js" />
            </div>
            <div className="col-span-1 bg-background flex items-center justify-center p-8">
              <img src="/prisma.svg" alt="Next.js" />
            </div>
            <div className="col-span-1 bg-background flex items-center justify-center p-8">
              <div className="flex items-center gap-3 cursor-pointer">
                <BklitLogo size={38} className="dark:text-white text-black" />
                <span className="text-2xl font-bold">Bklit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="col-span-1">
              <CardDecorator className="px-6 text-emerald-100">
                <Activity size={64} strokeWidth={1.5} />
              </CardDecorator>
              <CardHeader>
                <CardTitle className="text-xl bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                  Real-time analytics
                </CardTitle>
                <CardDescription className="text-lg">
                  Real-time analytics let you know what's happening in
                  real-time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="col-span-1">
              <CardDecorator className="px-6 text-emerald-100">
                <Cone size={64} strokeWidth={1.5} />
              </CardDecorator>
              <CardHeader>
                <CardTitle className="text-xl bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                  Funnel analysis
                </CardTitle>
                <CardDescription className="text-lg">
                  Funnels help you understand the path users take through your
                  app.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="col-span-1">
              <CardDecorator className="px-6 text-emerald-100">
                <MousePointer2 size={64} strokeWidth={1.5} />
              </CardDecorator>
              <CardHeader>
                <CardTitle className="text-xl bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                  Event triggers
                </CardTitle>
                <CardDescription className="text-lg">
                  Measure specific events in your app and trigger actions based
                  on them.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="col-span-1">
              <CardDecorator className="px-6 text-emerald-100">
                <Clapperboard size={64} strokeWidth={1.5} />
              </CardDecorator>
              <CardHeader>
                <CardTitle className="text-xl bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                  Sessions
                </CardTitle>
                <CardDescription className="text-lg">
                  Get a detailed view of each session and how they interact with
                  your app.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="col-span-1">
              <CardDecorator className="px-6 text-emerald-100">
                <Blend size={64} strokeWidth={1.5} />
              </CardDecorator>
              <CardHeader>
                <CardTitle className="text-xl bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                  Acquisitions
                </CardTitle>
                <CardDescription className="text-lg">
                  Track where your users come from and how they find your app.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="col-span-1">
              <CardDecorator className="px-6 text-emerald-100">
                <FlagTriangleRight size={64} strokeWidth={1.5} />
              </CardDecorator>
              <CardHeader>
                <CardTitle className="text-xl bg-clip-text text-transparent bg-linear-to-b from-amber-100 to-emerald-100">
                  Campaigns
                </CardTitle>
                <CardDescription className="text-lg">
                  Measure the effectiveness of your campaigns and track your
                  ROI.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="container mx-auto max-w-6xl px-4"></div>
      </div>
      <div className="container mx-auto max-w-6xl px-4 mb-12 mt-24">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground font-mono text-sm">
            &copy; {new Date().getFullYear()} Bklit. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}

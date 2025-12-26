import { Button } from "@bklit/ui/components/button";
import { cn } from "@bklit/ui/lib/utils";
import { ArrowRight, Check, Github } from "lucide-react";
import type { Metadata } from "next";
import { AnimatedGlobalStats } from "@/components/animated-global-stats";
import { AnimatedHeroVisual } from "@/components/animated-hero-visual";
import { BrandTiles } from "@/components/artworks/brand-tiles";
import { FunnelDemo } from "@/components/artworks/funnel-demo";
import { SankeyDemo } from "@/components/artworks/sankey-demo";
import { SDKs } from "@/components/artworks/sdks";
import { TopCountriesDemo } from "@/components/artworks/top-countries-demo";
import { FAQ } from "@/components/faq";
import { Features as SectionFeatures } from "@/components/features";
import { Footer } from "@/components/footer";
import { GithubStarCount } from "@/components/github-star-count";
import { Hero } from "@/components/hero";
import { PageHeader } from "@/components/page-header";
import { Pricing } from "@/components/pricing";
import { SectionBasic } from "@/components/section-basic";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Bklit Analytics",
  description:
    "Hosted Analytics and open-source, start tracking with 3 lines of code. A perfect replacement for Google Analytics & Mixpanel.",
};

export default function MarketingHomePage() {
  return (
    <>
      <PageHeader />
      <Hero />

      <div className="space-y-16">
        <div className={cn("relative w-full sm:min-h-[400px]")}>
          <div className="container mx-auto max-w-full sm:max-w-[1600px] px-4">
            <div className="grid grid-cols-1 grid-rows-1">
              <div className="col-start-1 row-start-1">
                <AnimatedHeroVisual />
              </div>
              <div className="col-start-1 row-start-1 flex items-center justify-center relative bg-linear-to-b from-transparent via-background/10 to-background" />
              <div className="col-start-1 row-start-1 flex items-end justify-center relative">
                <AnimatedGlobalStats />
              </div>
              <div className="col-start-1 row-start-1 flex items-start justify-center relative">
                <Button variant="default" size="lg">
                  Get started
                </Button>
              </div>
            </div>
          </div>
        </div>

        <SectionBasic title="Stacked" artwork={<BrandTiles />}>
          <p className="text-lg text-muted-foreground">
            Bklit is built with the best development tools in the industry, to
            help you build your next big thing.
          </p>
          <ul className="space-y-1 text-lg">
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check size={16} className="text-emerald-500" /> Typescript
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check size={16} className="text-emerald-500" /> tRPC
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check size={16} className="text-emerald-500" /> Shadcn
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check size={16} className="text-emerald-500" /> Nuqs
            </li>
          </ul>
          <Button variant="outline" size="lg" asChild>
            <a
              href="https://github.com/bklit/bklit"
              target="_blank"
              title="Bklit on Github"
              rel="noopener noreferrer"
            >
              <Github size={16} /> See on Github
              <span className="flex items-center gap-1 group-hover:opacity-100 opacity-70 transition-opacity">
                <GithubStarCount />
              </span>
            </a>
          </Button>
        </SectionBasic>

        <div className="space-y-16 px-4">
          <SectionHeader
            title="User journeys"
            description="See how users are navigating your website."
          />
          <div className="relative w-full min-h-[400px] overflow-hidden">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="perspective-normal">
                <div className="">
                  <SankeyDemo />
                </div>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full from-transparent to-background via-transparent bg-linear-to-b pointer-events-none" />
          </div>
        </div>

        <div className="space-y-16 px-4">
          <SectionBasic
            title="Top metrics at a glance"
            variant="mono"
            artwork={<TopCountriesDemo />}
          >
            <p className="text-lg text-muted-foreground">
              The Bklit dashboard gives you a quick overview of your top metrics
              at a glance, quickly see where your visitors are coming from and
              which pages are the most popular.
            </p>
            <Button variant="default" size="lg" asChild>
              <a
                href="https://app.bklit.com/signin?utm_source=website&utm_medium=homepage&utm_campaign=bklit"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get started <ArrowRight size={16} />
              </a>
            </Button>
          </SectionBasic>
        </div>

        <div className="space-y-16 px-4" id="features">
          <SectionHeader
            title="Product features"
            description="Everything you need to understand your website."
          />
          <SectionFeatures />
        </div>

        <div className="space-y-16 px-4">
          <SectionHeader
            title="Conversion funnels"
            description="Create funnels to improve your conversion rate."
          />
          <div className="relative w-full min-h-[400px]">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="perspective-distant">
                <div className="translate-y-0">
                  <FunnelDemo />
                </div>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full from-transparent to-background via-background/66 bg-linear-to-b pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full from-background via-transparent to-background bg-linear-to-r pointer-events-none" />
          </div>

          <SectionHeader
            title="Just 4 lines of code"
            description="Integrate with just 4 lines of code."
          />
          <SectionBasic title="Simple SDKs" artwork={<SDKs />}>
            <p className="text-lg text-muted-foreground">
              Bklit SDKs are designed to be simple and easy to use. Initialize
              once and start tracking your users.
            </p>
            <ul className="space-y-1 text-lg">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check size={16} className="text-emerald-500" /> Vanilla React
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check size={16} className="text-emerald-500" /> Next.js
              </li>
            </ul>
            <Button variant="default" size="lg" asChild>
              <a
                href="https://app.bklit.com/signin?utm_source=website&utm_medium=homepage&utm_campaign=bklit"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get started <ArrowRight size={16} />
              </a>
            </Button>
          </SectionBasic>
        </div>

        <div className="space-y-16 px-4">
          <SectionHeader
            title="Frequently asked questions"
            description="We've got some answers to the most common questions."
          />
          <FAQ />
        </div>

        <div className="space-y-16 px-4">
          <SectionHeader
            title="Pricing"
            description="Simple, transparent pricing for teams of all sizes."
          >
            <p className="text-sm text-muted-foreground">
              All prices exclude applicable taxes. Tax will be calculated at
              checkout based on your location.
            </p>
          </SectionHeader>
          <Pricing />
        </div>
      </div>
      <Footer />
    </>
  );
}

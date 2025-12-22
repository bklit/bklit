import { Button } from "@bklit/ui/components/button";
import { cn } from "@bklit/ui/lib/utils";
import { ArrowRight, Check, Github } from "lucide-react";
import type { Metadata } from "next";
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
import { ThemeImage } from "@/components/theme-image";

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
        <div
          className={cn(
            "relative w-full sm:min-h-[400px]",
            "after:pointer-events-none after:absolute after:inset-0 after:bg-linear-to-b after:from-transparent after:via-transparent after:to-background after:content-['']"
          )}
        >
          <div className="container mx-auto max-w-full px-4 sm:max-w-6xl">
            <div className="relative -z-10 grid grid-cols-1 grid-rows-1">
              <div className="sm:perspective-[4000px] col-start-1 row-start-1">
                <div
                  className={cn(
                    "relative -z-1 opacity-60 sm:translate-x-35 sm:-translate-y-50 sm:rotate-x-45 sm:rotate-y-30 sm:rotate-z-320 sm:scale-150",
                    "after:pointer-events-none after:absolute after:inset-0 after:bg-linear-to-b after:from-transparent after:via-transparent after:to-background after:content-['']",
                    "before:pointer-events-none before:absolute before:inset-0 before:bg-linear-to-r before:from-transparent before:via-transparent before:to-background sm:before:content-['']"
                  )}
                >
                  <ThemeImage
                    alt="Bklit Analytics"
                    height={1000}
                    srcDark="/bklit-analytics.png"
                    srcLight="/bklit-analytics-light.png"
                    width={1000}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <SectionBasic artwork={<BrandTiles />} title="Stacked">
          <p className="text-lg text-muted-foreground">
            Bklit is built with the best development tools in the industry, to
            help you build your next big thing.
          </p>
          <ul className="space-y-1 text-lg">
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check className="text-emerald-500" size={16} /> Typescript
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check className="text-emerald-500" size={16} /> tRPC
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check className="text-emerald-500" size={16} /> Shadcn
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check className="text-emerald-500" size={16} /> Nuqs
            </li>
          </ul>
          <Button asChild size="lg" variant="outline">
            <a
              href="https://github.com/bklit/bklit"
              rel="noopener noreferrer"
              target="_blank"
              title="Bklit on Github"
            >
              <Github size={16} /> See on Github
              <span className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                <GithubStarCount />
              </span>
            </a>
          </Button>
        </SectionBasic>

        <div className="space-y-16 px-4">
          <SectionHeader
            description="See how users are navigating your website."
            title="User journeys"
          />
          <div className="relative min-h-[400px] w-full overflow-hidden">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="perspective-normal">
                <div className="">
                  <SankeyDemo />
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-linear-to-b from-transparent via-transparent to-background" />
          </div>
        </div>

        <div className="space-y-16 px-4">
          <SectionBasic
            artwork={<TopCountriesDemo />}
            title="Top metrics at a glance"
            variant="mono"
          >
            <p className="text-lg text-muted-foreground">
              The Bklit dashboard gives you a quick overview of your top metrics
              at a glance, quickly see where your visitors are coming from and
              which pages are the most popular.
            </p>
            <Button asChild size="lg" variant="default">
              <a
                href="https://app.bklit.com/signin?utm_source=website&utm_medium=homepage&utm_campaign=bklit"
                rel="noopener noreferrer"
                target="_blank"
              >
                Get started <ArrowRight size={16} />
              </a>
            </Button>
          </SectionBasic>
        </div>

        <div className="space-y-16 px-4" id="features">
          <SectionHeader
            description="Everything you need to understand your website."
            title="Product features"
          />
          <SectionFeatures />
        </div>

        <div className="space-y-16 px-4">
          <SectionHeader
            description="Create funnels to improve your conversion rate."
            title="Conversion funnels"
          />
          <div className="relative min-h-[400px] w-full">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="perspective-distant">
                <div className="translate-y-0">
                  <FunnelDemo />
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-linear-to-b from-transparent via-background/66 to-background" />
            <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-linear-to-r from-background via-transparent to-background" />
          </div>

          <SectionHeader
            description="Integrate with just 4 lines of code."
            title="Just 4 lines of code"
          />
          <SectionBasic artwork={<SDKs />} title="Simple SDKs">
            <p className="text-lg text-muted-foreground">
              Bklit SDKs are designed to be simple and easy to use. Initialize
              once and start tracking your users.
            </p>
            <ul className="space-y-1 text-lg">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="text-emerald-500" size={16} /> Vanilla React
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="text-emerald-500" size={16} /> Next.js
              </li>
            </ul>
            <Button asChild size="lg" variant="default">
              <a
                href="https://app.bklit.com/signin?utm_source=website&utm_medium=homepage&utm_campaign=bklit"
                rel="noopener noreferrer"
                target="_blank"
              >
                Get started <ArrowRight size={16} />
              </a>
            </Button>
          </SectionBasic>
        </div>

        <div className="space-y-16 px-4">
          <SectionHeader
            description="We've got some answers to the most common questions."
            title="Frequently asked questions"
          />
          <FAQ />
        </div>

        <div className="space-y-16 px-4">
          <SectionHeader
            description="Simple, transparent pricing for teams of all sizes."
            title="Pricing"
          >
            <p className="text-muted-foreground text-sm">
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

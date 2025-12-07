import { Button } from "@bklit/ui/components/button";
import { cn } from "@bklit/ui/lib/utils";
import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import { BrandTiles } from "@/components/artworks/brand-tiles";
import { FunnelDemo } from "@/components/artworks/funnel-demo";
import { SankeyDemo } from "@/components/artworks/sankey-demo";
import { SDKs } from "@/components/artworks/sdks";
import { TopCountriesDemo } from "@/components/artworks/top-countries-demo";
import { FAQ } from "@/components/faq";
import { Features as SectionFeatures } from "@/components/features";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { PageHeader } from "@/components/page-header";
import { SectionBasic } from "@/components/section-basic";
import { SectionHeader } from "@/components/section-header";

export default function MarketingHomePage() {
  return (
    <>
      <PageHeader />
      <Hero />

      <div className="sm:space-y-38">
        <div className="-mt-12 sm:my-0">
          <div
            className={cn(
              "relative w-full sm:min-h-[400px]",
              "after:content-[''] after:absolute after:inset-0 after:bg-linear-to-b after:from-transparent after:via-transparent after:to-background after:pointer-events-none",
            )}
          >
            <div className="container mx-auto max-w-full sm:max-w-6xl px-4">
              <div className="relative grid grid-cols-1 grid-rows-1 -z-10">
                <div className="sm:perspective-[4000px] col-start-1 row-start-1">
                  <div
                    className={cn(
                      "relative sm:-translate-y-50 sm:translate-x-35 sm:rotate-x-45 sm:rotate-y-30 sm:rotate-z-320 sm:scale-150 -z-1 opacity-60",
                      "after:content-[''] after:absolute after:inset-0 after:bg-linear-to-b after:from-transparent after:via-transparent after:to-background after:pointer-events-none",
                      "sm:before:content-[''] before:absolute before:inset-0 before:bg-linear-to-r before:from-transparent before:via-transparent before:to-background before:pointer-events-none",
                    )}
                  >
                    <Image
                      src="/bklit-analytics.png"
                      alt="Bklit Analytics"
                      width={1000}
                      height={1000}
                    />
                  </div>
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
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-500" /> Typescript
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-500" /> tRPC
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-500" /> Shadcn
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-500" /> Nuqs
              </li>
            </ul>
            <Button variant="default" size="lg">
              Get started <ArrowRight size={16} />
            </Button>
          </SectionBasic>
        </div>

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
            <Button variant="default" size="lg">
              Get started <ArrowRight size={16} />
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
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-500" /> Vanilla React
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-500" /> Next.js
              </li>
            </ul>
            <Button variant="default" size="lg">
              Get started <ArrowRight size={16} />
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
      </div>
      <Footer />
    </>
  );
}

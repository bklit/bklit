import { Button } from "@bklit/ui/components/button";
import { cn } from "@bklit/ui/lib/utils";
import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { AnimatedGlobalStats } from "@/components/animated-global-stats";
import { AnimatedHeroVisual } from "@/components/animated-hero-visual";
import { DetectEverything } from "@/components/artworks/detect-everything";
import { FunnelDemo } from "@/components/artworks/funnel-demo";
import { SankeyDemo } from "@/components/artworks/sankey-demo";
import { SDKs } from "@/components/artworks/sdks";
import { FAQ } from "@/components/faq";
import { Features as SectionFeatures } from "@/components/features";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { PageHeader } from "@/components/page-header";
import { PageviewsView } from "@/components/pageviews-view";
import { SectionBasic } from "@/components/section-basic";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Bklit Analytics: Open-source, privacy-friendly analytics",
  description:
    "Hosted Analytics and open-source, start tracking with 3 lines of code. A perfect replacement for Google Analytics & Mixpanel.",
};

export default function MarketingHomePage() {
  return (
    <>
      <PageHeader />
      <Hero />

      <div className="flex flex-col space-y-16 sm:space-y-64">
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
            </div>
          </div>
        </div>

        <div className="space-y-16 px-4" id="product">
          <SectionHeader
            title="Detect everything, everywhere"
            description="Countries, Browsers &amp; Devices"
            align="left"
          />
          <div className="relative w-full min-h-[600px] ">
            <div className="container mx-auto max-w-6xl px-4">
              <DetectEverything />
            </div>
          </div>
        </div>

        <div className="space-y-16 px-4">
          <div className="relative w-full min-h-[400px] overflow-hidden">
            <div className="container mx-auto max-w-6xl px-4">
              <PageviewsView />
            </div>
            <div className="container mx-auto max-w-6xl px-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="col-span-1 border-b sm:border-r p-6 sm:p-12 space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">User Journeys</h2>
                    <p className="text-lg text-muted-foreground">
                      See where your users enter your website and where they
                      exit, and how they navigate through your website.
                    </p>
                  </div>
                  <div className="relative w-full min-h-[400px]">
                    <SankeyDemo />

                    <div className="absolute top-0 left-0 w-full h-full from-transparent to-background via-transparent bg-linear-to-b pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-1 border-b p-6 sm:p-12 space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Conversion funnels</h2>
                    <p className="text-lg text-muted-foreground">
                      Create funnels to improve your conversion rate across
                      campaigns and channels.
                    </p>
                  </div>
                  <div className="relative w-full">
                    <FunnelDemo />
                    <div className="absolute top-0 left-0 w-full h-full from-transparent to-background via-background/66 bg-linear-to-b pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
            <SectionFeatures />
          </div>
        </div>

        <div className="space-y-16 px-4 hidden sm:block">
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
            title="Got questions?"
            description="We've got answers"
          />
          <FAQ />
        </div>
        <Footer />
      </div>
    </>
  );
}

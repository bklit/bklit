import { Button } from "@bklit/ui/components/button";
import { cn } from "@bklit/ui/lib/utils";
import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { AnimateHeroNew } from "@/components/animate-hero-new";
import { AnimatedGlobalStats } from "@/components/animated-global-stats";
import { DetectEverything } from "@/components/artworks/detect-everything";
import { FunnelDemo } from "@/components/artworks/funnel-demo";
import { SankeyDemo } from "@/components/artworks/sankey-demo";
import { SDKs } from "@/components/artworks/sdks";
import { FAQ } from "@/components/faq";
import { Features as SectionFeatures } from "@/components/features";

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
    <div className="flex flex-col space-y-16 sm:space-y-64">
      <div className={cn("relative w-full sm:min-h-[400px]")}>
        <div className="container mx-auto max-w-full sm:max-w-[1600px]">
          <div className="grid grid-cols-1 grid-rows-1">
            <AnimateHeroNew />
            <div className="container mx-auto max-w-6xl px-4">
              <AnimatedGlobalStats />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-16 px-4" id="product">
        <SectionHeader
          align="left"
          description="Countries, Browsers &amp; Devices"
          title="Detect everything, everywhere"
        />
        <div className="relative min-h-[600px] w-full">
          <div className="container mx-auto max-w-6xl">
            <DetectEverything />
          </div>
        </div>
      </div>

      <div className="space-y-16 px-4">
        <div className="relative min-h-[400px] w-full overflow-hidden">
          <div className="container mx-auto max-w-6xl">
            <PageviewsView />
          </div>
          <div className="container mx-auto max-w-6xl border-t">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="col-span-1 space-y-8 border-b p-6 sm:border-r sm:p-12">
                <div className="space-y-2">
                  <h2 className="font-bold text-2xl">User Journeys</h2>
                  <p className="text-lg text-muted-foreground">
                    See where your users enter your website and where they exit,
                    and how they navigate through your website.
                  </p>
                </div>
                <div className="relative min-h-[400px] w-full">
                  <SankeyDemo />

                  <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-linear-to-b from-transparent via-transparent to-background" />
                </div>
              </div>
              <div className="col-span-1 space-y-8 border-b p-6 sm:p-12">
                <div className="space-y-2">
                  <h2 className="font-bold text-2xl">Conversion funnels</h2>
                  <p className="text-lg text-muted-foreground">
                    Create funnels to improve your conversion rate across
                    campaigns and channels.
                  </p>
                </div>
                <div className="relative w-full">
                  <FunnelDemo />
                  <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-linear-to-b from-transparent via-background/66 to-background" />
                </div>
              </div>
            </div>
          </div>
          <SectionFeatures />
        </div>
      </div>

      <div className="hidden space-y-16 px-4 sm:block">
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
        <SectionHeader description="We've got answers" title="Got questions?" />
        <FAQ />
      </div>
    </div>
  );
}

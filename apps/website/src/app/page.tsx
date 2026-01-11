import { Button } from "@bklit/ui/components/button";
import { cn } from "@bklit/ui/lib/utils";
import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { AnimateHeroNew } from "@/components/animate-hero-new";
import { AnimatedGlobalStats } from "@/components/animated-global-stats";
import { DetectEverything } from "@/components/artworks/detect-everything";
import { FunnelDemo } from "@/components/artworks/funnel-demo";
import {
  type NotificationItem,
  Notifications,
} from "@/components/artworks/notifications";
import { SankeyDemo } from "@/components/artworks/sankey-demo";
import { SDKs } from "@/components/artworks/sdks";
import { FAQ } from "@/components/faq";
import { Features as SectionFeatures } from "@/components/features";
import { PageviewsView } from "@/components/pageviews-view";
import { SectionBasic } from "@/components/section-basic";
import { SectionHeader } from "@/components/section-header";

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "us-visitor",
    title: "New live visitor from United States.",
    description: "Viewing on desktop",
    countryCode: "us",
  },
  {
    id: "gb-visitor",
    title: "New live visitor from United Kingdom.",
    description: "Viewing on mobile",
    countryCode: "gb",
  },
  {
    id: "de-visitor",
    title: "New live visitor from Germany.",
    description: "Viewing on desktop",
    countryCode: "de",
  },
  {
    id: "fr-visitor",
    title: "New live visitor from France.",
    description: "Viewing on mobile",
    countryCode: "fr",
  },
  {
    id: "jp-visitor",
    title: "New live visitor from Japan.",
    description: "Viewing on desktop",
    countryCode: "jp",
  },
  {
    id: "ca-visitor",
    title: "New live visitor from Canada.",
    description: "Viewing on mobile",
    countryCode: "ca",
  },
];

export const metadata: Metadata = {
  title: "Bklit Analytics: Open-source, privacy-friendly analytics",
  description:
    "Hosted Analytics and open-source, start tracking with 3 lines of code. A perfect replacement for Google Analytics & Mixpanel.",
};

export default function MarketingHomePage() {
  return (
    <div className="flex flex-col space-y-16 pb-16 sm:space-y-64 sm:pb-64">
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
        </div>
      </div>

      <div className="md:px-4">
        <div className="container mx-auto max-w-6xl md:border-t">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="col-span-1 space-y-8 p-6 sm:border-r sm:p-12 md:border-b">
              <div className="space-y-2">
                <h2 className="font-semibold text-2xl text-slate-300">
                  User Journeys
                </h2>
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
            <div className="col-span-1 space-y-8 p-6 sm:p-12 md:border-b">
              <div className="space-y-2">
                <h2 className="font-semibold text-2xl text-slate-300">
                  Conversion funnels
                </h2>
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

      <div className="space-y-16 md:px-4">
        <div className="container mx-auto max-w-6xl md:border-t">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="col-span-1 space-y-8 p-6 sm:border-r sm:p-12 md:border-b">
              <div className="space-y-2">
                <h2 className="font-semibold text-slate-300 text-xl">
                  User Journeys
                </h2>
                <p className="text-lg text-muted-foreground">
                  See where your users enter your website and where they exit,
                  and how they navigate through your website.
                </p>
              </div>
              <div className="relative w-full">Hi world</div>
            </div>
            <div className="col-span-1 space-y-8 overflow-hidden p-6 sm:p-12 md:border-b">
              <div className="space-y-2">
                <h2 className="font-semibold text-slate-300 text-xl">
                  Real-time
                </h2>
                <p className="text-lg text-muted-foreground">
                  Real-time analytics let you know where your visitors are in in
                  the world and what they are interested in.
                </p>
              </div>
              <div className="relative flex aspect-video w-full items-center justify-center">
                <div className="relative w-full">
                  <Notifications items={MOCK_NOTIFICATIONS} />
                </div>
              </div>
            </div>
          </div>
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

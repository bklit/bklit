import { Button } from "@bklit/ui/components/button";
import { Github } from "lucide-react";
import { Logo } from "@/components/logo";
import { PageHeader } from "@/components/page-header";

export default function MarketingHomePage() {
  return (
    <main className="w-full min-h-screen bklit-hero flex flex-col">
      <PageHeader />
      <div className="container mx-auto flex flex-col mt-8 px-4">
        <div className="flex items-center justify-start w-full h-[600px]">
          <div className="py-10 space-y-3">
            <h1 className="text-2xl font-normal font-mono">
              Analytics for Developers
            </h1>
            <p className="text-muted-foreground font-mono text-md">
              Real-time analytics, funnel analysis, custom event triggers, and
              more.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="lg" asChild>
                <a
                  href="https://github.com/bklit/bklit"
                  target="_blank"
                  title="Bklit on Github"
                  rel="noopener noreferrer"
                >
                  <Github size={16} /> OpenSource
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full border-t border-b border-bklit-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-6 gap-px bg-bklit-600 px-px">
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
              <Logo height={30} />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full border-b border-bklit-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-px bg-bklit-600 px-px">
            <div className="col-span-1 bg-background flex flex-col items-start justify-start p-8 space-y-4">
              <h5 className="text-lg text-left font-bold font-mono">
                Real-time analytics
              </h5>
              <p className="text-muted-foreground font-mono text-sm">
                Instantly see where you're users are coming from in real-time,
                with live session data.
              </p>
            </div>
            <div className="col-span-1 bg-background flex flex-col items-start justify-start p-8 space-y-4">
              <h5 className="text-lg text-left font-semibold font-mono">
                Session analytics
              </h5>
              <p className="text-muted-foreground font-mono text-base">
                Track your users' sessions and see how they interact with your
                website and view their flow.
              </p>
            </div>
            <div className="col-span-1 bg-background flex flex-col items-start justify-start p-8 space-y-4">
              <h5 className="text-lg text-left font-semibold font-mono">
                Custom event triggers
              </h5>
              <p className="text-muted-foreground font-mono text-base">
                Trigger custom events when your users perform certain actions,
                such as clicking a button or submitting a form or simply by
                viewing a page.
              </p>
            </div>
            <div className="col-span-1 bg-background flex flex-col items-start justify-start p-8 space-y-4">
              <h5 className="text-lg text-left font-semibold font-mono">
                User location tracking
              </h5>
              <p className="text-muted-foreground font-mono text-base">
                See where your users are coming from, with city and country and
                locale.
              </p>
            </div>
            <div className="col-span-1 bg-background flex flex-col items-start justify-start p-8 space-y-4">
              <h5 className="text-lg text-left font-semibold font-mono">
                Fully open-source
              </h5>
              <p className="text-muted-foreground font-mono text-base">
                All of our code is open-source and available on GitHub.
              </p>
            </div>
            <div className="col-span-1 bg-background flex flex-col items-start justify-start p-8 space-y-4">
              <h5 className="text-lg text-left font-semibold font-mono">
                Polar Subscription
              </h5>
              <p className="text-muted-foreground font-mono text-base">
                Workspace and project limits with Polar.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full border-b border-bklit-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-px bg-bklit-600 px-px">
            <div className="col-span-1 bg-background flex flex-col items-start justify-start p-8 space-y-4">
              <h3 className="text-xl text-left font-semibold font-mono">
                Simple SDK
              </h3>
              <p className="text-muted-foreground font-mono text-sm">
                Simple SDK to integrate with your website and start tracking
                your users.
              </p>
            </div>
            <div className="col-span-1 bg-bklit-900 flex flex-col items-start justify-start p-8 space-y-4">
              <pre className="font-mono text-sm overflow-x-auto">
                <code className="text-bklit-100">
                  {`import { initBklit } from "@bklit/sdk";

initBklit({
  projectId: "your-project-id",
  apiHost: "https://your-api-host.com",
  environment: "development",
  debug: true,
});`}
                </code>
              </pre>
            </div>
            <div className="col-span-1 bg-bklit-900 flex flex-col items-start justify-start p-8 space-y-4">
              <pre className="font-mono text-sm overflow-x-auto">
                <code className="text-bklit-100">
                  {`<a href="/" data-bklit-event="checkout">
  Home
</a>

window.trackEvent("checkout", "custom_event");
`}
                </code>
              </pre>
            </div>
            <div className="col-span-1 bg-background flex flex-col items-start justify-start p-8 space-y-4">
              <h3 className="text-xl text-left font-semibold font-mono">
                Custom events
              </h3>
              <p className="text-muted-foreground font-mono text-sm">
                Easy-to-use API to track custom events, use data attributes, id
                attributes or manual tracking.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mb-12 mt-24">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground font-mono text-sm">
            &copy; {new Date().getFullYear()} Bklit. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}

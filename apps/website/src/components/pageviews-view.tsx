import { Button } from "@bklit/ui/components/button";
import { ArrowRight, Clock, Eye, Users } from "lucide-react";
import Image from "next/image";

export const PageviewsView = () => {
  return (
    <div className="flex flex-col">
      <div className="relative flex flex-col sm:grid sm:grid-cols-2 sm:grid-rows-1">
        <div className="relative col-span-2 col-start-1 row-start-1 border-b">
          <div className="perspective-[3000px]">
            <div className="relative aspect-video w-full overflow-hidden">
              <Image
                alt="Pageviews View"
                className="absolute origin-top-right sm:left-48 sm:scale-120"
                height={1350}
                src="/pageviews.png"
                width={1960}
              />
            </div>
          </div>
          <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-linear-to-b from-transparent via-transparent to-background" />
          <div className="pointer-events-none absolute top-0 left-0 hidden h-full w-full bg-linear-to-l from-transparent via-30% via-transparent to-background sm:block" />
          <div className="pointer-events-none absolute top-0 left-0 hidden h-full w-full bg-linear-to-r from-transparent via-80% via-transparent to-background sm:block" />
        </div>
        <div className="relative col-span-1 col-start-1 row-start-1 space-y-4 p-6 sm:p-12">
          <div className="space-y-2">
            <h3 className="font-bold text-2xl">Visual understading</h3>
            <p className="text-muted-foreground text-xl">
              See how many pageviews your website has received and how they are
              distributed across your website or application.
            </p>
          </div>
          <Button asChild size="lg" variant="outline">
            <a
              href="https://app.bklit.com/signin?utm_source=website&utm_medium=homepage&utm_campaign=bklit"
              rel="noopener noreferrer"
              target="_blank"
            >
              Get started <ArrowRight size={16} />
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-4">
          <div className="flex flex-col gap-1 p-6 sm:border-r sm:p-12">
            <h3 className="flex items-center gap-2 font-bold text-lg">
              <Eye className="text-chart-1" size={14} /> Views
            </h3>
            <div className="text-muted-foreground text-sm">
              Track page views and entry points
            </div>
          </div>
          <div className="flex flex-col gap-1 p-6 sm:border-r sm:p-12">
            <h3 className="flex items-center gap-2 font-bold text-lg">
              <Users className="text-chart-2" size={14} /> Users
            </h3>
            <div className="text-muted-foreground text-sm">
              Track unique users on every page
            </div>
          </div>
          <div className="flex flex-col gap-1 p-6 sm:border-r sm:p-12">
            <h3 className="flex items-center gap-2 font-bold text-lg">
              <Users className="text-chart-3" size={14} /> Avg/User
            </h3>
            <div className="text-muted-foreground text-sm">
              Track average page views per user
            </div>
          </div>
          <div className="flex flex-col gap-1 p-6 sm:p-12">
            <h3 className="flex items-center gap-2 font-bold text-lg">
              <Clock className="text-chart-4" size={14} /> Last Viewed
            </h3>
            <div className="text-muted-foreground text-sm">
              Track when users last viewed a page
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

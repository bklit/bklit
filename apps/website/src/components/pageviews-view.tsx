import { Button } from "@bklit/ui/components/button";
import { ArrowRight, Clock, Eye, Users } from "lucide-react";
import Image from "next/image";

export const PageviewsView = () => {
  return (
    <div className="flex flex-col">
      <div className="relative flex flex-col sm:grid sm:grid-cols-2 sm:grid-rows-1">
        <div className="col-start-1 row-start-1 col-span-2 relative border-b">
          <div className="perspective-[3000px]">
            <div className="w-full aspect-video overflow-hidden relative">
              <Image
                src="/pageviews.png"
                alt="Pageviews View"
                width={1960}
                height={1350}
                className="sm:scale-120 origin-top-right absolute sm:left-48"
              />
            </div>
          </div>
          <div className="absolute top-0 left-0 w-full h-full from-transparent to-background via-transparent bg-linear-to-b pointer-events-none" />
          <div className="hidden sm:block absolute top-0 left-0 w-full h-full from-transparent to-background via-transparent via-30% bg-linear-to-l pointer-events-none" />
          <div className="hidden sm:block absolute top-0 left-0 w-full h-full from-transparent to-background via-transparent via-80% bg-linear-to-r pointer-events-none" />
        </div>
        <div className="col-start-1 row-start-1 col-span-1 relative space-y-4 p-6 sm:p-12">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Visual understading</h3>
            <p className="text-xl text-muted-foreground">
              See how many pageviews your website has received and how they are
              distributed across your website or application.
            </p>
          </div>
          <Button variant="outline" size="lg" asChild>
            <a
              href="https://app.bklit.com/signin?utm_source=website&utm_medium=homepage&utm_campaign=bklit"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get started <ArrowRight size={16} />
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-0">
          <div className="flex flex-col gap-1 sm:border-r p-6 sm:p-12">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Eye size={14} className="text-chart-1" /> Views
            </h3>
            <div className="text-sm text-muted-foreground">
              Track page views and entry points
            </div>
          </div>
          <div className="flex flex-col gap-1 sm:border-r p-6 sm:p-12">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users size={14} className="text-chart-2" /> Users
            </h3>
            <div className="text-sm text-muted-foreground">
              Track unique users on every page
            </div>
          </div>
          <div className="flex flex-col gap-1 sm:border-r p-6 sm:p-12">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users size={14} className="text-chart-3" /> Avg/User
            </h3>
            <div className="text-sm text-muted-foreground">
              Track average page views per user
            </div>
          </div>
          <div className="flex flex-col gap-1 p-6 sm:p-12">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock size={14} className="text-chart-4" /> Last Viewed
            </h3>
            <div className="text-sm text-muted-foreground">
              Track when users last viewed a page
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { PieDonut } from "@bklit/ui/components/charts/pie-donut";
import { ProgressRow } from "@bklit/ui/components/progress-row";
import { ChromeIcon } from "@bklit/ui/icons/chrome";
import { EdgeIcon } from "@bklit/ui/icons/edge";
import { FirefoxIcon } from "@bklit/ui/icons/firefox";
import { SafariIcon } from "@bklit/ui/icons/safari";
import { Monitor, Smartphone } from "lucide-react";
import { CircleFlag } from "react-circle-flags";

interface CountryData {
  country: string;
  countryCode: string;
  views: number;
}

interface BrowserData {
  name: string;
  value: number;
}

interface SessionData {
  id: string;
  browser: string;
  device: string;
  pageCount: number;
  timeAgo: string;
}

const mockCountries: CountryData[] = [
  { country: "United States", countryCode: "us", views: 45230 },
  { country: "United Kingdom", countryCode: "gb", views: 28340 },
  { country: "Germany", countryCode: "de", views: 19250 },
  { country: "France", countryCode: "fr", views: 16890 },
  { country: "Canada", countryCode: "ca", views: 12450 },
];

const mockBrowsers: BrowserData[] = [
  { name: "chrome", value: 48230 },
  { name: "safari", value: 32140 },
  { name: "firefox", value: 18920 },
  { name: "edge", value: 12450 },
  { name: "other", value: 8760 },
];

const mockSessions: SessionData[] = [
  {
    id: "1",
    browser: "chrome",
    device: "Desktop",
    pageCount: 8,
    timeAgo: "2 mins ago",
  },
  {
    id: "2",
    browser: "safari",
    device: "Mobile",
    pageCount: 5,
    timeAgo: "5 mins ago",
  },
  {
    id: "3",
    browser: "firefox",
    device: "Desktop",
    pageCount: 12,
    timeAgo: "8 mins ago",
  },
  {
    id: "4",
    browser: "edge",
    device: "Desktop",
    pageCount: 3,
    timeAgo: "15 mins ago",
  },
  {
    id: "5",
    browser: "chrome",
    device: "Mobile",
    pageCount: 6,
    timeAgo: "23 mins ago",
  },
];

const getBrowserIcon = (browser: string, size = 16) => {
  switch (browser.toLowerCase()) {
    case "chrome":
      return <ChromeIcon size={size} />;
    case "safari":
      return <SafariIcon size={size} />;
    case "firefox":
      return <FirefoxIcon size={size} />;
    case "edge":
      return <EdgeIcon size={size} />;
    default:
      return <ChromeIcon size={size} />;
  }
};

const getDeviceIcon = (device: string) => {
  if (device === "Mobile") {
    return <Smartphone size={16} />;
  }
  return <Monitor size={16} />;
};

export const DetectEverything = () => {
  const totalCountryViews = mockCountries.reduce(
    (sum, country) => sum + country.views,
    0,
  );

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="perspective-[2000px]">
        {/* Card 1: Top Countries */}
        <div className="w-[400px]  skew-y-[-4deg] rotate-x-[-14deg] rotate-y-20 translate-z-0 translate-x-0 translate-y-0 preserve-3d [transition:transform,background_0.32s_var(--ease-out-quad)]">
          <Card className="w-full h-fit shadow-2xl absolute inset-0">
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
              <CardDescription>Top countries by page views.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {mockCountries.map((country) => {
                  const percentage =
                    totalCountryViews > 0
                      ? ((Number(country.views) || 0) / totalCountryViews) * 100
                      : 0;
                  return (
                    <ProgressRow
                      key={country.countryCode}
                      label={country.country}
                      value={country.views}
                      percentage={percentage}
                      icon={
                        <CircleFlag
                          countryCode={country.countryCode.toLowerCase()}
                          className="size-4"
                        />
                      }
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card 2: Browser Usage */}
        <div className="w-[400px]  skew-y-[-4deg] rotate-x-[-14deg] rotate-y-20 translate-z-12 translate-x-12 translate-y-12 preserve-3d [transition:transform,background_0.32s_var(--ease-out-quad)]">
          <Card className="w-full h-fit shadow-2xl absolute inset-0">
            <CardHeader>
              <CardTitle>Browser Usage</CardTitle>
              <CardDescription>Page visits by browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <PieDonut
                data={mockBrowsers}
                centerLabel={{ showTotal: true, suffix: "page views" }}
                className=""
              />
            </CardContent>
          </Card>
        </div>

        {/* Card 3: Recent Sessions */}
        <div className="w-[400px]  skew-y-[-4deg] rotate-x-[-14deg] rotate-y-20 translate-z-24 translate-x-24 translate-y-24 preserve-3d [transition:transform,background_0.32s_var(--ease-out-quad)]">
          <Card className="w-full h-fit shadow-2xl absolute inset-0">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>The most recent sessions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {mockSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between border-b py-1.5 px-2 last-of-type:border-b-0 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span>{getBrowserIcon(session.browser)}</span>
                        <span className="text-muted-foreground">
                          {getDeviceIcon(session.device)}
                        </span>
                        <span className="text-sm">
                          {session.pageCount} pages
                        </span>
                      </div>
                    </div>
                    <div className="gap-2 text-xs text-muted-foreground">
                      {session.timeAgo}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

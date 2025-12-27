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
  { country: "Australia", countryCode: "au", views: 9870 },
  { country: "Japan", countryCode: "jp", views: 7650 },
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
  {
    id: "6",
    browser: "safari",
    device: "Desktop",
    pageCount: 4,
    timeAgo: "31 mins ago",
  },
  {
    id: "7",
    browser: "firefox",
    device: "Mobile",
    pageCount: 7,
    timeAgo: "45 mins ago",
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
      <div className="perspective-[2000px] group -translate-x-20">
        <div
          className="card-0 w-[400px] skew-y-[-4deg] rotate-x-[-14deg] rotate-y-20 preserve-3d transition-all duration-300 ease-out
            translate-z-0 translate-x-0 translate-y-0
            group-hover:translate-z-0 group-hover:-translate-x-12 group-hover:translate-y-0
            hover:-translate-y-5!
            group-has-[.card-1:hover]:opacity-30 group-has-[.card-1:hover]:blur-sm
            group-has-[.card-2:hover]:opacity-30 group-has-[.card-2:hover]:blur-sm"
        >
          <Card className="w-full h-fit shadow-2xl absolute inset-0 bg-card">
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

        <div
          className="card-1 w-[400px] skew-y-[-4deg] rotate-x-[-14deg] rotate-y-20 preserve-3d transition-all duration-300 ease-out
            translate-z-20 translate-x-20 translate-y-20
            group-hover:translate-z-20 group-hover:translate-x-20 group-hover:translate-y-20
            hover:translate-y-15!
            group-has-[.card-0:hover]:opacity-30 group-has-[.card-0:hover]:blur-sm
            group-has-[.card-2:hover]:opacity-30 group-has-[.card-2:hover]:blur-sm"
        >
          <Card className="w-full h-fit shadow-2xl absolute inset-0 bg-card">
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

        <div
          className="card-2 w-[400px] skew-y-[-4deg] rotate-x-[-14deg] rotate-y-20 preserve-3d transition-all duration-300 ease-out
            translate-z-40 translate-x-40 translate-y-40
            group-hover:translate-z-40 group-hover:translate-x-52 group-hover:translate-y-40
            hover:translate-y-35!
            group-has-[.card-0:hover]:opacity-30 group-has-[.card-0:hover]:blur-sm
            group-has-[.card-1:hover]:opacity-30 group-has-[.card-1:hover]:blur-sm"
        >
          <Card className="w-full h-fit shadow-2xl absolute inset-0 bg-card">
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
      </div>
    </div>
  );
};

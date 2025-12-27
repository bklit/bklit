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
import { useState } from "react";
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
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [parentHovered, setParentHovered] = useState(false);

  const totalCountryViews = mockCountries.reduce(
    (sum, country) => sum + country.views,
    0,
  );

  const getCardClasses = (cardIndex: number) => {
    const isHovered = hoveredCard === cardIndex;
    const isOtherHovered = hoveredCard !== null && !isHovered;

    let translateClasses = "";
    let opacityClass = "opacity-100"; // All cards full opacity by default
    let blurClass = "";

    // Base transforms for each card - equal spacing of 20 units
    const baseTransforms = [
      "translate-z-0 translate-x-0 translate-y-0",
      "translate-z-20 translate-x-20 translate-y-20",
      "translate-z-40 translate-x-40 translate-y-40",
    ];

    // Spread transforms when parent is hovered (push cards apart on X axis)
    const spreadTransforms = [
      "translate-z-0 -translate-x-12 translate-y-0",
      "translate-z-20 translate-x-20 translate-y-20",
      "translate-z-40 translate-x-52 translate-y-40",
    ];

    if (parentHovered) {
      // Parent is hovered - use spread positions
      const spreadX = ["-translate-x-12", "translate-x-20", "translate-x-52"][
        cardIndex
      ];
      const spreadZ = ["translate-z-0", "translate-z-20", "translate-z-40"][
        cardIndex
      ];

      if (isHovered) {
        // This card is hovered - lift it up, full opacity, no blur
        const liftedY = [`-translate-y-5`, `translate-y-15`, `translate-y-35`][
          cardIndex
        ];
        translateClasses = `${spreadZ} ${spreadX} ${liftedY}`;
        opacityClass = "opacity-100";
        blurClass = "";
      } else if (isOtherHovered) {
        // Another card is hovered - reduce opacity and blur this card
        translateClasses = spreadTransforms[cardIndex] ?? "";
        opacityClass = "opacity-30";
        blurClass = "blur-sm";
      } else {
        // Parent hovered but no specific card - spread position, full opacity
        translateClasses = spreadTransforms[cardIndex] ?? "";
        opacityClass = "opacity-100";
        blurClass = "";
      }
    } else {
      // Parent not hovered - use base positions, full opacity
      translateClasses = baseTransforms[cardIndex] ?? "";
      opacityClass = "opacity-100";
      blurClass = "";
    }

    return `${translateClasses} ${opacityClass} ${blurClass}`;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        role="group"
        className="perspective-[2000px]"
        onMouseEnter={() => setParentHovered(true)}
        onMouseLeave={() => {
          setParentHovered(false);
          setHoveredCard(null);
        }}
      >
        {/* Card 0: Top Countries (Back - 33% opacity) */}
        <div
          role="button"
          tabIndex={0}
          className={`w-[400px] skew-y-[-4deg] rotate-x-[-14deg] rotate-y-20 preserve-3d transition-all duration-300 ease-out ${getCardClasses(0)}`}
          onMouseEnter={() => setHoveredCard(0)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => {}}
          onKeyDown={() => {}}
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

        {/* Card 1: Recent Sessions (Middle - 66% opacity) */}
        <div
          role="button"
          tabIndex={0}
          className={`w-[400px] skew-y-[-4deg] rotate-x-[-14deg] rotate-y-20 preserve-3d transition-all duration-300 ease-out ${getCardClasses(1)}`}
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => {}}
          onKeyDown={() => {}}
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

        {/* Card 2: Browser Usage (Front - 100% opacity) */}
        <div
          role="button"
          tabIndex={0}
          className={`scale-95 w-[400px] skew-y-[-4deg] rotate-x-[-14deg] rotate-y-20 preserve-3d transition-all duration-300 ease-out ${getCardClasses(2)}`}
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => {}}
          onKeyDown={() => {}}
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

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
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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

type CardType = "countries" | "sessions" | "browsers";

interface CardPosition {
  z: number;
  y: number;
  scale: number;
  overlayOpacity: number;
}

const positions: Record<string, CardPosition> = {
  back: { z: 0, y: -80, scale: 0.85, overlayOpacity: 0.8 },
  middle: { z: 30, y: -40, scale: 0.92, overlayOpacity: 0.5 },
  front: { z: 60, y: 0, scale: 1, overlayOpacity: 0 },
  hidden: { z: -30, y: -120, scale: 0.75, overlayOpacity: 1 },
};

export const DetectEverything = () => {
  const totalCountryViews = mockCountries.reduce(
    (sum, country) => sum + country.views,
    0,
  );

  const [cardOrder, setCardOrder] = useState<CardType[]>([
    "countries",
    "sessions",
    "browsers",
  ]);
  const [isHovering, setIsHovering] = useState<CardType | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const cycleCards = () => {
    if (isHovering) return;
    setCardOrder((prev) => {
      const newOrder = [...prev];
      const last = newOrder.pop();
      if (last) newOrder.unshift(last);
      return newOrder;
    });
  };

  useEffect(() => {
    intervalRef.current = setInterval(cycleCards, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovering]);

  const bringToFront = (cardType: CardType) => {
    setIsHovering(cardType);
    const currentIndex = cardOrder.indexOf(cardType);
    if (currentIndex === 2) return;

    const newOrder = cardOrder.filter((c) => c !== cardType);
    newOrder.push(cardType);
    setCardOrder(newOrder);
  };

  const handleMouseLeave = () => {
    setIsHovering(null);
  };

  const getCardPosition = (cardType: CardType): CardPosition => {
    const index = cardOrder.indexOf(cardType);
    if (index === 0) return positions.back as CardPosition;
    if (index === 1) return positions.middle as CardPosition;
    if (index === 2) return positions.front as CardPosition;
    return positions.hidden as CardPosition;
  };

  const renderCard = (cardType: CardType) => {
    const pos = getCardPosition(cardType);
    const zIndex = Math.round(pos.z);

    switch (cardType) {
      case "countries":
        return (
          <motion.div
            key={cardType}
            className="w-[400px] absolute top-0 left-0"
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateX(10deg)",
              zIndex,
            }}
            animate={{
              translateZ: pos.z,
              translateY: pos.y,
              scale: pos.scale,
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <Card className="relative w-full h-fit shadow-2xl bg-card overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-background pointer-events-none"
                animate={{ opacity: pos.overlayOpacity }}
                transition={{
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
                <CardDescription>Top countries by page views.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  {mockCountries.map((country) => {
                    const percentage =
                      totalCountryViews > 0
                        ? ((Number(country.views) || 0) / totalCountryViews) *
                          100
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
          </motion.div>
        );

      case "sessions":
        return (
          <motion.div
            key={cardType}
            className="w-[400px] absolute top-0 left-0"
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateX(10deg)",
              zIndex,
            }}
            animate={{
              translateZ: pos.z,
              translateY: pos.y,
              scale: pos.scale,
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <Card className="relative w-full h-fit shadow-2xl bg-card overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-background pointer-events-none"
                animate={{ opacity: pos.overlayOpacity }}
                transition={{
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
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
          </motion.div>
        );

      case "browsers":
        return (
          <motion.div
            key={cardType}
            className="w-[400px] absolute top-0 left-0"
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateX(10deg)",
              zIndex,
            }}
            animate={{
              translateZ: pos.z,
              translateY: pos.y,
              scale: pos.scale,
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <Card className="relative w-full h-fit shadow-2xl bg-card overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-background pointer-events-none"
                animate={{ opacity: pos.overlayOpacity }}
                transition={{
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
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
          </motion.div>
        );
    }
  };

  return (
    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-8">
      <div className="col-span-1 space-y-6 sm:border-l">
        <button
          type="button"
          className="flex flex-col gap-2 p-6 sm:p-12 border-b cursor-pointer transition-colors hover:bg-accent/50 text-left w-full"
          onMouseEnter={() => bringToFront("browsers")}
          onMouseLeave={handleMouseLeave}
        >
          <h2 className="text-xl font-bold">Browser Usage</h2>
          <p className="text-lg text-muted-foreground">
            Gain insight into which browsers your visitors are using and how
            they're interacting with your website.
          </p>
        </button>
        <button
          type="button"
          className="flex flex-col gap-2 p-6 sm:p-12 border-b cursor-pointer transition-colors hover:bg-accent/50 text-left w-full"
          onMouseEnter={() => bringToFront("sessions")}
          onMouseLeave={handleMouseLeave}
        >
          <h3 className="text-xl font-bold">Recent Sessions</h3>
          <p className="text-lg text-muted-foreground">
            Understand your users' behavior and how they flow through your
            website.
          </p>
        </button>
        <button
          type="button"
          className="flex flex-col gap-2 p-6 sm:p-12 cursor-pointer transition-colors hover:bg-accent/50 text-left w-full"
          onMouseEnter={() => bringToFront("countries")}
          onMouseLeave={handleMouseLeave}
        >
          <h3 className="text-xl font-bold">Top Countries</h3>
          <p className="text-lg text-muted-foreground">
            Gain insight into where your visitors are coming from and what
            timezones they're in.
          </p>
        </button>
      </div>
      <div className="col-span-1 hidden sm:flex items-start justify-center">
        <div className="flex flex-col items-center justify-center">
          <div
            className="relative h-[450px] w-[400px] scale-50 sm:scale-90"
            style={{
              perspective: "2000px",
              transformStyle: "preserve-3d",
            }}
          >
            {["countries", "sessions", "browsers"].map((cardType) =>
              renderCard(cardType as CardType),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

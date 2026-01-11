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
import { cn } from "@bklit/ui/lib/utils";
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
  { country: "United States", countryCode: "us", views: 45_230 },
  { country: "United Kingdom", countryCode: "gb", views: 28_340 },
  { country: "Germany", countryCode: "de", views: 19_250 },
  { country: "France", countryCode: "fr", views: 16_890 },
  { country: "Canada", countryCode: "ca", views: 12_450 },
  { country: "Australia", countryCode: "au", views: 9870 },
  { country: "Japan", countryCode: "jp", views: 7650 },
];

const mockBrowsers: BrowserData[] = [
  { name: "chrome", value: 48_230 },
  { name: "safari", value: 32_140 },
  { name: "firefox", value: 18_920 },
  { name: "edge", value: 12_450 },
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
    0
  );

  const [cardOrder, setCardOrder] = useState<CardType[]>([
    "countries",
    "sessions",
    "browsers",
  ]);
  const [isHovering, setIsHovering] = useState<CardType | null>(null);
  const [showPulse, setShowPulse] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cycleCards = () => {
    if (isHovering) {
      return;
    }
    setCardOrder((prev) => {
      const newOrder = [...prev];
      const last = newOrder.pop();
      if (last) {
        newOrder.unshift(last);
      }
      return newOrder;
    });
  };

  useEffect(() => {
    intervalRef.current = setInterval(cycleCards, 3000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [cycleCards]);

  useEffect(() => {
    if (isHovering) {
      pulseTimeoutRef.current = setTimeout(() => {
        setShowPulse(true);
      }, 200);
    } else {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
      setShowPulse(false);
    }
    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, [isHovering]);

  const bringToFront = (cardType: CardType) => {
    setIsHovering(cardType);
    const currentIndex = cardOrder.indexOf(cardType);
    if (currentIndex === 2) {
      return;
    }

    const newOrder = cardOrder.filter((c) => c !== cardType);
    newOrder.push(cardType);
    setCardOrder(newOrder);
  };

  const handleMouseLeave = () => {
    setIsHovering(null);
  };

  const isActive = (cardType: CardType) => {
    return cardOrder[2] === cardType;
  };

  const getCardPosition = (cardType: CardType): CardPosition => {
    const index = cardOrder.indexOf(cardType);
    if (index === 0) {
      return positions.back as CardPosition;
    }
    if (index === 1) {
      return positions.middle as CardPosition;
    }
    if (index === 2) {
      return positions.front as CardPosition;
    }
    return positions.hidden as CardPosition;
  };

  const renderCard = (cardType: CardType) => {
    const pos = getCardPosition(cardType);
    const zIndex = Math.round(pos.z);

    switch (cardType) {
      case "countries":
        return (
          <motion.div
            animate={{
              translateZ: pos.z,
              translateY: pos.y,
              scale: pos.scale,
            }}
            className="absolute top-0 left-0 w-[400px]"
            key={cardType}
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateX(10deg)",
              zIndex,
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <Card className="relative h-fit w-full overflow-hidden bg-card shadow-2xl">
              <motion.div
                animate={{ opacity: pos.overlayOpacity }}
                className="pointer-events-none absolute inset-0 bg-background"
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
                        icon={
                          <CircleFlag
                            className="size-4"
                            countryCode={country.countryCode.toLowerCase()}
                          />
                        }
                        key={country.countryCode}
                        label={country.country}
                        percentage={percentage}
                        value={country.views}
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
            animate={{
              translateZ: pos.z,
              translateY: pos.y,
              scale: pos.scale,
            }}
            className="absolute top-0 left-0 w-[400px]"
            key={cardType}
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateX(10deg)",
              zIndex,
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <Card className="relative h-fit w-full overflow-hidden bg-card shadow-2xl">
              <motion.div
                animate={{ opacity: pos.overlayOpacity }}
                className="pointer-events-none absolute inset-0 bg-background"
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
                      className="flex items-center justify-between border-b px-2 py-1.5 transition-colors last-of-type:border-b-0 hover:bg-accent/50"
                      key={session.id}
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
                      <div className="gap-2 text-muted-foreground text-xs">
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
            animate={{
              translateZ: pos.z,
              translateY: pos.y,
              scale: pos.scale,
            }}
            className="absolute top-0 left-0 w-[400px]"
            key={cardType}
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateX(10deg)",
              zIndex,
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <Card className="relative h-fit w-full overflow-hidden bg-card shadow-2xl">
              <motion.div
                animate={{ opacity: pos.overlayOpacity }}
                className="pointer-events-none absolute inset-0 bg-background"
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
                  centerLabel={{ showTotal: true, suffix: "page views" }}
                  className=""
                  data={mockBrowsers}
                />
              </CardContent>
            </Card>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-0 sm:grid sm:grid-cols-2 sm:gap-8">
      <div className="col-span-1">
        <button
          className={`flex w-full cursor-pointer flex-col gap-2 border-b p-4 text-left transition-colors sm:p-14 ${
            isActive("browsers")
              ? "bg-accent/30 hover:bg-accent/40"
              : "hover:bg-accent/50"
          }`}
          onMouseEnter={() => bringToFront("browsers")}
          onMouseLeave={handleMouseLeave}
          type="button"
        >
          <h2 className="font-bold text-md text-slate-300 sm:text-xl">
            Browser Usage
          </h2>
          <p className="text-muted-foreground text-xs sm:text-lg">
            Gain insight into which browsers your visitors are using and how
            they're interacting with your website.
          </p>
        </button>
        <button
          className={cn(
            "flex w-full cursor-pointer flex-col gap-2 border-b p-4 text-left transition-colors sm:p-14",
            isActive("sessions")
              ? "bg-accent/30 hover:bg-accent/40"
              : "hover:bg-accent/50"
          )}
          onMouseEnter={() => bringToFront("sessions")}
          onMouseLeave={handleMouseLeave}
          type="button"
        >
          <h3 className="font-bold text-md text-slate-300 sm:text-xl">
            Recent Sessions
          </h3>
          <p className="text-muted-foreground text-xs sm:text-lg">
            Understand your users' behavior and how they flow through your
            website.
          </p>
        </button>
        <button
          className={cn(
            "flex w-full cursor-pointer flex-col gap-2 p-4 text-left transition-colors sm:p-14",
            isActive("countries")
              ? "bg-accent/30 hover:bg-accent/40"
              : "hover:bg-accent/50"
          )}
          onMouseEnter={() => bringToFront("countries")}
          onMouseLeave={handleMouseLeave}
          type="button"
        >
          <h3 className="font-bold text-md text-slate-300 sm:text-xl">
            Top Countries
          </h3>
          <p className="text-muted-foreground text-xs sm:text-lg">
            Gain insight into where your visitors are coming from and what
            timezones they're in.
          </p>
        </button>
      </div>
      <div className="col-span-1 flex flex-col space-y-4">
        <section
          aria-label="Interactive card showcase"
          className="flex flex-col items-center justify-center pt-4 sm:pt-12"
          onMouseEnter={() => setIsHovering("cards" as CardType)}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="relative h-[400px] w-[400px] scale-80 sm:scale-95"
            style={{
              perspective: "2000px",
              transformStyle: "preserve-3d",
            }}
          >
            {["countries", "sessions", "browsers"].map((cardType) =>
              renderCard(cardType as CardType)
            )}
          </div>
        </section>
        <div className="flex items-center justify-center">
          <div
            className={cn(
              "relative size-4 rounded",
              showPulse ? "overflow-visible" : "overflow-clip"
            )}
          >
            <motion.div
              animate={{
                rotate: isHovering ? 0 : 360,
                opacity: isHovering ? 0 : 1,
              }}
              className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 size-8"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent, var(--bklit-400) 360deg, transparent 360deg)",
              }}
              transition={{
                rotate: {
                  duration: 3,
                  ease: "linear",
                  repeat: Number.POSITIVE_INFINITY,
                },
                opacity: {
                  duration: 0.2,
                },
              }}
            />
            <motion.div
              animate={{
                scale: showPulse ? [1, 1.2, 1] : 1,
                opacity: showPulse ? [1, 0.5, 1] : 1,
              }}
              className="absolute inset-px rounded-[3px] bg-bklit-700"
              transition={{
                duration: showPulse ? 0.9 : 0,
                ease: "easeOut",
                repeat: showPulse ? Number.POSITIVE_INFINITY : 0,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

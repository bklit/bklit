"use client";

import { Button } from "@bklit/ui/components/button";
import { ButtonGroup } from "@bklit/ui/components/button-group";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { ChangeIndicator } from "@bklit/ui/components/change-indicator";
import { PieDonut } from "@bklit/ui/components/charts/pie-donut";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bklit/ui/components/dropdown-menu";
import { ProgressRow } from "@bklit/ui/components/progress-row";
import { useIsMobile } from "@bklit/ui/hooks/use-mobile";
import { ChromeIcon } from "@bklit/ui/icons/chrome";
import { EdgeIcon } from "@bklit/ui/icons/edge";
import { FirefoxIcon } from "@bklit/ui/icons/firefox";
import { SafariIcon } from "@bklit/ui/icons/safari";
import NumberFlow from "@number-flow/react";
import {
  CalendarIcon,
  ChevronDown,
  GitCompare,
  Monitor,
  Smartphone,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CircleFlag } from "react-circle-flags";

const mockBrowsers = [
  { name: "chrome", value: 48_230 },
  { name: "safari", value: 32_140 },
  { name: "firefox", value: 18_920 },
  { name: "edge", value: 12_450 },
  { name: "other", value: 8760 },
];

const mockCountries = [
  { country: "United States", countryCode: "us", views: 45_230, change: 12.5 },
  { country: "United Kingdom", countryCode: "gb", views: 28_340, change: 8.3 },
  { country: "Germany", countryCode: "de", views: 19_250, change: -3.2 },
  { country: "France", countryCode: "fr", views: 16_890, change: 15.7 },
  { country: "Canada", countryCode: "ca", views: 12_450, change: 5.1 },
];

const mockPageviews = [
  { path: "/", views: 12_450, change: 18.2 },
  { path: "/pricing", views: 8340, change: -5.4 },
  { path: "/docs", views: 6890, change: 22.7 },
  { path: "/blog", views: 4230, change: 9.1 },
  { path: "/about", views: 3120, change: -12.3 },
];

const mockSessions = [
  { browser: "chrome", device: "Desktop", pages: 8, time: "2 mins ago" },
  { browser: "safari", device: "Mobile", pages: 5, time: "5 mins ago" },
  { browser: "firefox", device: "Desktop", pages: 12, time: "8 mins ago" },
  { browser: "edge", device: "Desktop", pages: 3, time: "15 mins ago" },
  { browser: "firefox", device: "Mobile", pages: 3, time: "15 mins ago" },
];

const mockMobileDesktop = [
  { name: "desktop", value: 22_401, label: "Desktop" },
  { name: "mobile", value: 12_056, label: "Mobile" },
];

const mockBounceRate = [
  { name: "engaged", value: 19_872, label: "Engaged" },
  { name: "bounced", value: 14_585, label: "Bounced" },
];

const getBrowserIcon = (browser: string) => {
  switch (browser.toLowerCase()) {
    case "chrome":
      return <ChromeIcon size={16} />;
    case "safari":
      return <SafariIcon size={16} />;
    case "firefox":
      return <FirefoxIcon size={16} />;
    case "edge":
      return <EdgeIcon size={16} />;
    default:
      return <ChromeIcon size={16} />;
  }
};

function DashboardContent() {
  const totalCountryViews = mockCountries.reduce((sum, c) => sum + c.views, 0);
  const totalPageViews = mockPageviews.reduce((sum, p) => sum + p.views, 0);

  const [totalSessions, setTotalSessions] = useState(0);
  const [bounceRate, setBounceRate] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [conversions, setConversions] = useState(0);

  useEffect(() => {
    // Animate numbers in on page load
    const timer = setTimeout(() => {
      setTotalSessions(34_567);
      setBounceRate(42);
      setUniqueVisitors(12_345);
      setConversions(1234);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative flex h-full flex-col overflow-auto rounded-xl border border-border bg-zinc-50 p-8 dark:bg-bklit-800">
      {/* Page Header */}
      <div className="mx-auto mb-6 flex w-[1400px] flex-row items-center justify-between gap-4">
        <div className="flex w-full flex-col gap-2">
          <h1 className="font-bold text-xl">Welcome back, Matt!</h1>
          <p className="text-base text-muted-foreground">Quick insights...</p>
        </div>
        <div className="flex w-auto items-center justify-end gap-2">
          <ButtonGroup>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="justify-start text-left font-normal"
                  size="lg"
                  variant="outline"
                >
                  <span className="text-sm">Last 30 days</span>
                  <ChevronDown className="ml-1 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Today</DropdownMenuItem>
                <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                <DropdownMenuItem>Last 90 days</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="lg" variant="outline">
              <CalendarIcon className="size-4" />
            </Button>
            <Button
              aria-label="Toggle comparison"
              size="lg"
              variant="secondary"
            >
              <GitCompare className="size-4" />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <div className="mx-auto flex w-[1400px] flex-col gap-4">
        {/* Row 1: Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>A quick overview of your app.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-2xl">
                      <NumberFlow value={totalSessions} />
                      <ChangeIndicator change={8.3} uniqueKey="sessions" />
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Total Sessions
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-2xl">
                      <NumberFlow suffix="%" value={bounceRate} />
                      <ChangeIndicator change={-5.4} uniqueKey="bounce-rate" />
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Bounce Rate
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-2xl">
                      <NumberFlow value={uniqueVisitors} />
                      <ChangeIndicator
                        change={12.5}
                        uniqueKey="unique-visits"
                      />
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Unique Visitors
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-2xl">
                      <NumberFlow value={conversions} />
                      <ChangeIndicator change={15.7} uniqueKey="conversions" />
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Conversions
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
              <CardDescription>Top countries by page views.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {mockCountries.map((country) => {
                  const percentage =
                    totalCountryViews > 0
                      ? (country.views / totalCountryViews) * 100
                      : 0;
                  return (
                    <ProgressRow
                      change={country.change}
                      changeUniqueKey={`country-${country.countryCode}`}
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

          <Card>
            <CardHeader>
              <CardTitle>Popular Pages</CardTitle>
              <CardDescription>
                The most popular pages by views.
              </CardDescription>
              <CardAction>
                <Button size="sm" variant="ghost">
                  View All
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {mockPageviews.map((page) => {
                  const percentage =
                    totalPageViews > 0
                      ? (page.views / totalPageViews) * 100
                      : 0;
                  return (
                    <ProgressRow
                      change={page.change}
                      changeUniqueKey={`page-${page.path}`}
                      key={page.path}
                      label={page.path}
                      percentage={percentage}
                      value={page.views}
                      variant="secondary"
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Map & Sessions */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <Card className="relative z-30 h-full overflow-visible p-0">
              <CardHeader className="absolute top-0 z-10 grid w-full rounded-t-xl bg-card-background pt-6 pb-4 backdrop-blur-xl">
                <CardTitle>Visitors by Country</CardTitle>
                <CardDescription>
                  A map of the world with the number of unique visitors per
                  country.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full min-h-[300px] w-full overflow-visible p-0">
                <div className="relative h-full w-full">
                  <Image
                    alt="World Map"
                    className="h-auto w-full rounded-xl"
                    height={460}
                    priority
                    src="/mockup/map.svg"
                    unoptimized
                    width={840}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>The most recent sessions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  {mockSessions.map((session) => (
                    <div
                      className="flex items-center justify-between border-b px-2 py-1.5 transition-colors last-of-type:border-b-0 hover:bg-accent/50"
                      key={session.browser}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <span>{getBrowserIcon(session.browser)}</span>
                          <span className="text-muted-foreground">
                            {session.device === "Mobile" ? (
                              <Smartphone size={16} />
                            ) : (
                              <Monitor size={16} />
                            )}
                          </span>
                          <span className="text-sm">{session.pages} pages</span>
                        </div>
                      </div>
                      <div className="gap-2 text-muted-foreground text-xs">
                        {session.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Row 3: Chart Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Browser Usage</CardTitle>
              <CardDescription>Page visits by browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <PieDonut
                centerLabel={{
                  showTotal: true,
                  suffix: "page views",
                }}
                data={mockBrowsers}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile/Desktop</CardTitle>
              <CardDescription>
                34,457 unique page visits by device type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PieDonut
                centerLabel={{ showTotal: true, suffix: "unique visits" }}
                className="min-h-[250px] w-full"
                data={mockMobileDesktop}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>42% Bounce Rate</CardTitle>
              <CardDescription>
                14,585 of 34,457 sessions bounced
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PieDonut
                centerLabel={{ showTotal: true, suffix: "sessions" }}
                className="min-h-[250px] w-full"
                data={mockBounceRate}
                variant="positive-negative"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export function FakeDashboard({
  animationStarted = false,
}: {
  animationStarted?: boolean;
}) {
  const isMobile = useIsMobile();

  return (
    <div className="pointer-events-none relative h-[1283px] w-[1942px] origin-top-left scale-40 rounded-xl border md:scale-100">
      {/* Header SVG */}
      <motion.div
        animate={
          animationStarted
            ? {
                opacity: 1,
                filter: "blur(0px)",
                z: 0,
                y: 0,
                x: 0,
              }
            : {}
        }
        initial={{
          opacity: 0,
          filter: "blur(5px)",
          z: 100,
          y: -100,
          x: 100,
        }}
        transition={{
          delay: 0.1,
          duration: 0.8,
          ease: "easeOut",
        }}
      >
        <Image
          alt="Dashboard Header"
          className="absolute top-0 right-0 left-0 z-50"
          height={60}
          priority
          src="/mockup/site-header.svg"
          unoptimized
          width={1942}
        />
      </motion.div>

      {/* Sidebar SVG */}
      <motion.div
        animate={
          animationStarted
            ? {
                opacity: 1,
                filter: "blur(0px)",
                z: 0,
                y: 0,
                x: 0,
              }
            : {}
        }
        initial={{
          opacity: 0,
          filter: "blur(5px)",
          z: 100,
          y: -100,
          x: 100,
        }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeOut",
        }}
      >
        <Image
          alt="Dashboard Sidebar"
          className="absolute top-[80px] left-[20px] z-40"
          height={326}
          priority
          src="/mockup/sidebar.svg"
          unoptimized
          width={190}
        />
      </motion.div>

      {/* Content Area */}
      <motion.div
        animate={
          animationStarted
            ? {
                opacity: 1,
                filter: "blur(0px)",
                z: 0,
                y: 0,
                x: 0,
              }
            : {}
        }
        className="absolute top-[80px] right-6 bottom-6 left-[230px]"
        initial={{
          opacity: 0,
          filter: "blur(5px)",
          z: 100,
          y: -100,
          x: 100,
        }}
        transition={{
          delay: 0,
          duration: 0.8,
          ease: "easeOut",
        }}
      >
        {isMobile ? (
          <Image
            alt="Dashboard Content"
            className="absolute top-0 right-6 bottom-6 left-4"
            height={1197}
            priority
            src="/mockup/content.svg"
            unoptimized
            width={1686}
          />
        ) : (
          <DashboardContent />
        )}
      </motion.div>
    </div>
  );
}

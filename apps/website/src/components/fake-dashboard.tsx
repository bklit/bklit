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
  { name: "chrome", value: 48230 },
  { name: "safari", value: 32140 },
  { name: "firefox", value: 18920 },
  { name: "edge", value: 12450 },
  { name: "other", value: 8760 },
];

const mockCountries = [
  { country: "United States", countryCode: "us", views: 45230, change: 12.5 },
  { country: "United Kingdom", countryCode: "gb", views: 28340, change: 8.3 },
  { country: "Germany", countryCode: "de", views: 19250, change: -3.2 },
  { country: "France", countryCode: "fr", views: 16890, change: 15.7 },
  { country: "Canada", countryCode: "ca", views: 12450, change: 5.1 },
];

const mockPageviews = [
  { path: "/", views: 12450, change: 18.2 },
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
  { name: "desktop", value: 22401, label: "Desktop" },
  { name: "mobile", value: 12056, label: "Mobile" },
];

const mockBounceRate = [
  { name: "engaged", value: 19872, label: "Engaged" },
  { name: "bounced", value: 14585, label: "Bounced" },
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
      setTotalSessions(34567);
      setBounceRate(42);
      setUniqueVisitors(12345);
      setConversions(1234);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex flex-col dark:bg-bklit-800 bg-zinc-50 border border-border rounded-xl overflow-auto h-full relative p-8">
      {/* Page Header */}
      <div className="flex flex-row justify-between items-center w-[1400px] mx-auto mb-6 gap-4">
        <div className="flex flex-col gap-2 w-full">
          <h1 className="text-xl font-bold">Welcome back, Matt!</h1>
          <p className="text-base text-muted-foreground">Quick insights...</p>
        </div>
        <div className="flex items-center gap-2 justify-end w-auto">
          <ButtonGroup>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="justify-start text-left font-normal"
                >
                  <span className="text-sm">Last 30 days</span>
                  <ChevronDown className="size-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Today</DropdownMenuItem>
                <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                <DropdownMenuItem>Last 90 days</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="lg">
              <CalendarIcon className="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              aria-label="Toggle comparison"
            >
              <GitCompare className="size-4" />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <div className="w-[1400px] mx-auto flex flex-col gap-4">
        {/* Row 1: Stats Cards */}
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>A quick overview of your app.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <NumberFlow value={totalSessions} />
                      <ChangeIndicator change={8.3} uniqueKey="sessions" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Sessions
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <NumberFlow value={bounceRate} suffix="%" />
                      <ChangeIndicator change={-5.4} uniqueKey="bounce-rate" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Bounce Rate
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <NumberFlow value={uniqueVisitors} />
                      <ChangeIndicator
                        change={12.5}
                        uniqueKey="unique-visits"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Unique Visitors
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <NumberFlow value={conversions} />
                      <ChangeIndicator change={15.7} uniqueKey="conversions" />
                    </div>
                    <div className="text-sm text-muted-foreground">
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
                      key={country.countryCode}
                      label={country.country}
                      value={country.views}
                      percentage={percentage}
                      change={country.change}
                      changeUniqueKey={`country-${country.countryCode}`}
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
                      key={page.path}
                      variant="secondary"
                      label={page.path}
                      value={page.views}
                      percentage={percentage}
                      change={page.change}
                      changeUniqueKey={`page-${page.path}`}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Map & Sessions */}
        <div className="grid gap-4 grid-cols-12">
          <div className="col-span-8">
            <Card className="p-0 relative h-full overflow-visible z-30">
              <CardHeader className="absolute grid top-0 w-full bg-card-background backdrop-blur-xl z-10 pt-6 pb-4 rounded-t-xl">
                <CardTitle>Visitors by Country</CardTitle>
                <CardDescription>
                  A map of the world with the number of unique visitors per
                  country.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full w-full p-0 overflow-visible min-h-[300px]">
                <div className="relative w-full h-full">
                  <Image
                    src="/mockup/map.svg"
                    alt="World Map"
                    width={840}
                    height={460}
                    className="w-full h-auto rounded-xl"
                    priority
                    unoptimized
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
                  {mockSessions.map((session, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b py-1.5 px-2 last-of-type:border-b-0 hover:bg-accent/50 transition-colors"
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
                      <div className="gap-2 text-xs text-muted-foreground">
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
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Browser Usage</CardTitle>
              <CardDescription>Page visits by browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <PieDonut
                data={mockBrowsers}
                centerLabel={{
                  showTotal: true,
                  suffix: "page views",
                }}
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
                data={mockMobileDesktop}
                className="min-h-[250px] w-full"
                centerLabel={{ showTotal: true, suffix: "unique visits" }}
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
                data={mockBounceRate}
                variant="positive-negative"
                className="min-h-[250px] w-full"
                centerLabel={{ showTotal: true, suffix: "sessions" }}
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
  return (
    <div className="w-[1942px] h-[1283px] relative pointer-events-none border rounded-xl">
      {/* Header SVG */}
      <motion.div
        initial={{
          opacity: 0,
          filter: "blur(5px)",
          z: 100,
          y: -100,
          x: 100,
        }}
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
        transition={{
          delay: 0.1,
          duration: 0.8,
          ease: "easeOut",
        }}
      >
        <Image
          src="/mockup/site-header.svg"
          alt="Dashboard Header"
          width={1942}
          height={60}
          className="absolute top-0 left-0 right-0 z-50"
          priority
          unoptimized
        />
      </motion.div>

      {/* Sidebar SVG */}
      <motion.div
        initial={{
          opacity: 0,
          filter: "blur(5px)",
          z: 100,
          y: -100,
          x: 100,
        }}
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
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeOut",
        }}
      >
        <Image
          src="/mockup/sidebar.svg"
          alt="Dashboard Sidebar"
          width={190}
          height={326}
          className="absolute top-[80px] left-[20px] z-40"
          priority
          unoptimized
        />
      </motion.div>

      {/* Content Area */}
      <motion.div
        className="absolute top-[80px] left-[230px] right-6 bottom-6"
        initial={{
          opacity: 0,
          filter: "blur(5px)",
          z: 100,
          y: -100,
          x: 100,
        }}
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
        transition={{
          delay: 0,
          duration: 0.8,
          ease: "easeOut",
        }}
      >
        <DashboardContent />
      </motion.div>
    </div>
  );
}

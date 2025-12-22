"use client";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Kbd } from "@bklit/ui/components/kbd";
import { Separator } from "@bklit/ui/components/separator";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { CircleFlag } from "react-circle-flags";
import { PageHeader } from "@/components/header/page-header";
import { UserSession } from "@/components/reactflow/user-session";
import { getCountryCodeForFlag } from "@/lib/maps/country-coordinates";
import { cleanUrl } from "@/lib/utils";
import {
  getBrowserFromUserAgent,
  getBrowserIcon,
} from "@/lib/utils/get-browser-icon";
import {
  getDeviceIcon,
  getDeviceTypeFromUserAgent,
} from "@/lib/utils/get-device-icon";
import { useTRPC } from "@/trpc/react";

interface SessionDetailsProps {
  organizationId: string;
  projectId: string;
  sessionId: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0s";

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function SessionDetails({
  organizationId,
  projectId,
  sessionId,
}: SessionDetailsProps) {
  const trpc = useTRPC();

  const { data: sessionData, isLoading } = useQuery(
    trpc.session.getById.queryOptions({
      sessionId,
      projectId,
      organizationId,
    })
  );

  if (isLoading) {
    return (
      <>
        <PageHeader
          description="Loading session details..."
          title="Session Details"
        />
        <div className="container mx-auto flex gap-4 px-4 py-6">
          <div className="flex w-3/12 flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Session overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Started
                    </span>
                    <span className="font-medium text-sm">Loading...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Duration
                    </span>
                    <span className="font-medium text-sm">Loading...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Pages Viewed
                    </span>
                    <span className="font-medium text-sm">Loading...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Status
                    </span>
                    <span className="font-medium text-sm">Loading...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="w-9/12">
            <Card>
              <CardHeader>
                <CardTitle>Page Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center">Loading session data...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (!sessionData) {
    return (
      <>
        <PageHeader description="Session not found" title="Session Details" />
        <div className="container mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Session not found</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const browser = getBrowserFromUserAgent(sessionData.userAgent);
  const deviceType = getDeviceTypeFromUserAgent(sessionData.userAgent);

  return (
    <>
      {/* Header */}
      <PageHeader
        description={`${sessionData.project.name} • ${sessionData.project.domain}`}
        title="Session Details"
      >
        <div className="flex items-center gap-2">
          <Link href={`/${organizationId}/${projectId}/sessions`}>
            <Button size="lg" variant="ghost">
              <ArrowLeft />
              Back to Sessions
            </Button>
          </Link>
        </div>
      </PageHeader>
      <div className="container mx-auto flex gap-4">
        <div className="flex w-full grid-cols-4 flex-col gap-4 sm:grid">
          <div className="col-span-1 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Session overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Started</span>
                  <span className="font-medium text-sm">
                    {format(new Date(sessionData.startedAt), "PPp")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Duration
                  </span>
                  <span className="font-medium text-sm">
                    {formatDuration(sessionData.duration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Pages Viewed
                  </span>
                  <span className="font-medium text-sm">
                    {sessionData.pageViewEvents.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Status</span>
                  <Badge
                    variant={sessionData.didBounce ? "destructive" : "default"}
                  >
                    {sessionData.didBounce ? "Bounced" : "Engaged"}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Browser</span>
                  <span className="flex items-center gap-2 font-medium text-sm">
                    {getBrowserIcon(browser)}
                    {browser}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Device</span>
                  <span className="flex items-center gap-2 font-medium text-sm">
                    {getDeviceIcon(deviceType)}
                    {deviceType}
                  </span>
                </div>
                {sessionData.visitorId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Visitor ID
                    </span>
                    <Kbd>
                      <code>{sessionData.visitorId}</code>
                    </Kbd>
                  </div>
                )}
                <Separator />
                {sessionData.country ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Country
                      </span>
                      <span className="flex items-center gap-2 font-medium text-sm">
                        <CircleFlag
                          className="size-4"
                          countryCode={
                            getCountryCodeForFlag(sessionData.country) || "us"
                          }
                        />
                        {sessionData.country}
                      </span>
                    </div>
                    {sessionData.city && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          City
                        </span>
                        <span className="font-medium text-sm">
                          {sessionData.city}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    Location data not available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Page flow</CardTitle>
              </CardHeader>
              <CardContent className="">
                {sessionData.pageViewEvents.map(
                  (
                    pageView: {
                      id: string;
                      url: string;
                      timestamp: Date;
                      country: string | null;
                      city: string | null;
                    },
                    index: number
                  ) => {
                    const cleanURL = cleanUrl(
                      pageView.url,
                      sessionData.project.domain
                    );
                    return (
                      <Fragment key={pageView.id}>
                        <div className="group/row flex items-center space-x-4">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bklit-600 font-semibold text-bklit-100 text-sm group-first/row:bg-teal-900 group-first/row:text-teal-500">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-mono text-bklit-200 text-sm">
                              {cleanURL}
                            </div>
                          </div>
                          {index === 0 && (
                            <Badge size="lg" variant="success">
                              Entry
                            </Badge>
                          )}
                          {index === sessionData.pageViewEvents.length - 1 && (
                            <Badge size="lg" variant="destructive">
                              Exit
                            </Badge>
                          )}
                        </div>
                        {index !== sessionData.pageViewEvents.length - 1 && (
                          <div className="ml-3.5 block h-2 w-0.5 bg-bklit-500" />
                        )}
                      </Fragment>
                    );
                  }
                )}
              </CardContent>
            </Card>
          </div>

          <div className="col-span-9 col-start-2">
            <UserSession
              session={{
                ...sessionData,
                site: {
                  name: sessionData.project.name,
                  domain: sessionData.project.domain,
                },
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

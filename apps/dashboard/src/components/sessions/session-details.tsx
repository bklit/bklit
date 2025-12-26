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

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 && hours === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(" ") || "0s";
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
    }),
  );

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Session Details"
          description="Loading session details..."
        />
        <div className="container mx-auto py-6 px-4 flex gap-4">
          <div className="w-3/12 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Session overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Started
                    </span>
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Duration
                    </span>
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Pages Viewed
                    </span>
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <span className="text-sm font-medium">Loading...</span>
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
                <div className="text-center py-8">Loading session data...</div>
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
        <PageHeader title="Session Details" description="Session not found" />
        <div className="container mx-auto">
          <Card>
            <CardContent className="text-center py-8">
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
        title="Session Details"
        description={`${sessionData.project.name} • ${sessionData.project.domain}`}
      >
        <div className="flex items-center gap-2">
          <Link href={`/${organizationId}/${projectId}/sessions`}>
            <Button variant="ghost" size="lg">
              <ArrowLeft />
              Back to Sessions
            </Button>
          </Link>
        </div>
      </PageHeader>
      <div className="container mx-auto flex gap-4">
        <div className="flex flex-col sm:grid grid-cols-4 gap-4 w-full">
          <div className="flex flex-col gap-4 col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Session overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Started</span>
                  <span className="text-sm font-medium">
                    {format(new Date(sessionData.startedAt), "PPp")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Duration
                  </span>
                  <span className="text-sm font-medium">
                    {formatDuration(sessionData.duration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Pages Viewed
                  </span>
                  <span className="text-sm font-medium">
                    {sessionData.pageViewEvents.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={sessionData.didBounce ? "destructive" : "default"}
                  >
                    {sessionData.didBounce ? "Bounced" : "Engaged"}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Browser</span>
                  <span className="text-sm font-medium flex items-center gap-2">
                    {getBrowserIcon(browser)}
                    {browser}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Device</span>
                  <span className="text-sm font-medium flex items-center gap-2">
                    {getDeviceIcon(deviceType)}
                    {deviceType}
                  </span>
                </div>
                {sessionData.visitorId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
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
                      <span className="text-sm text-muted-foreground">
                        Country
                      </span>
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <CircleFlag
                          countryCode={
                            getCountryCodeForFlag(sessionData.country) || "us"
                          }
                          className="size-4"
                        />
                        {sessionData.country}
                      </span>
                    </div>
                    {sessionData.city && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          City
                        </span>
                        <span className="text-sm font-medium">
                          {sessionData.city}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
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
                    index: number,
                  ) => {
                    const cleanURL = cleanUrl(
                      pageView.url,
                      sessionData.project.domain,
                    );
                    return (
                      <Fragment key={pageView.id}>
                        <div className="flex items-center space-x-4 group/row">
                          <div className="shrink-0 size-8 rounded-full text-bklit-100 flex items-center justify-center text-sm font-semibold bg-bklit-600 group-first/row:bg-teal-900 group-first/row:text-teal-500">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-mono text-bklit-200 truncate">
                              {cleanURL}
                            </div>
                          </div>
                          {index === 0 && (
                            <Badge variant="success" size="lg">
                              Entry
                            </Badge>
                          )}
                          {index === sessionData.pageViewEvents.length - 1 && (
                            <Badge variant="destructive" size="lg">
                              Exit
                            </Badge>
                          )}
                        </div>
                        {index !== sessionData.pageViewEvents.length - 1 && (
                          <div className="block w-0.5 h-2 bg-bklit-500 ml-3.5" />
                        )}
                      </Fragment>
                    );
                  },
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

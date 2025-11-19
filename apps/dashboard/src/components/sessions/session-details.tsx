"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/header/page-header";
import { UserSession } from "@/components/reactflow/user-session";
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
                <CardTitle className="text-base font-normal">
                  Session overview
                </CardTitle>
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
        <div className="w-3/12 flex flex-col gap-4">
          {/* Session Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-normal">
                Session overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Started</span>
                  <span className="text-sm font-medium">
                    {formatDistanceToNow(new Date(sessionData.startedAt), {
                      addSuffix: true,
                    })}
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
              </div>
            </CardContent>
          </Card>

          {/* Device & Browser */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-normal">
                Device & browser
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
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
                    <span className="font-mono text-xs">
                      {sessionData.visitorId}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-normal">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {sessionData.country ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Country
                      </span>
                      <span className="text-sm font-medium">
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
              </div>
            </CardContent>
          </Card>

          {/* Page Flow */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-normal">Page flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                  ) => (
                    <div
                      key={pageView.id}
                      className="flex items-center space-x-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {pageView.url}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(pageView.timestamp), "HH:mm:ss")}
                          {pageView.country && ` • ${pageView.country}`}
                          {pageView.city && `, ${pageView.city}`}
                        </div>
                      </div>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Entry
                        </Badge>
                      )}
                      {index === sessionData.pageViewEvents.length - 1 && (
                        <Badge variant="secondary" className="text-xs">
                          Exit
                        </Badge>
                      )}
                    </div>
                  ),
                )}
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
              <UserSession
                session={{
                  ...sessionData,
                  site: {
                    name: sessionData.project.name,
                    domain: sessionData.project.domain,
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { getRecentSessions } from "@/actions/session-actions";
import {
  getBrowserFromUserAgent,
  getBrowserIcon,
} from "@/lib/utils/get-browser-icon";
import {
  getDeviceIcon,
  getDeviceTypeFromUserAgent,
} from "@/lib/utils/get-device-icon";
import type { SessionAnalyticsCardProps } from "@/types/analytics-cards";
import { NoDataCard } from "./no-data-card";

export async function SessionAnalyticsCard({
  projectId,
  organizationId,
}: SessionAnalyticsCardProps) {
  const sessions = await getRecentSessions(projectId, 10);

  // If no data return empty card
  if (sessions.length === 0) {
    return (
      <NoDataCard
        title="Recent Sessions"
        description="The most recent sessions."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
        <CardDescription>The most recent sessions.</CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/${organizationId || ""}/${projectId}/sessions`}>
              View All
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sessions found
            </p>
          ) : (
            sessions.map((session) => {
              const browser = getBrowserFromUserAgent(session.userAgent);
              const deviceType = getDeviceTypeFromUserAgent(session.userAgent);
              return (
                <Link
                  key={session.id}
                  href={`/${organizationId || ""}/${projectId}/sessions/${session.id}`}
                  className="flex items-center justify-between border-b py-1.5 px-2 last-of-type:border-b-0 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span>{getBrowserIcon(browser)}</span>
                      <span className="text-muted-foreground">
                        {getDeviceIcon(deviceType)}
                      </span>
                      <span className="text-sm">
                        {session.pageViewEvents.length} pages
                      </span>
                    </div>
                  </div>
                  <div className="gap-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(session.startedAt), {
                      addSuffix: true,
                    })}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

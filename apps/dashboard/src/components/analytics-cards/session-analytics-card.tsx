import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Recent Sessions</CardTitle>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/${organizationId || ""}/${projectId}/sessions`}>
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sessions found
            </p>
          ) : (
            sessions.map((session) => {
              console.log("session 🎃", session);
              const browser = getBrowserFromUserAgent(session.userAgent);
              const deviceType = getDeviceTypeFromUserAgent(session.userAgent);
              return (
                <Link
                  key={session.id}
                  href={`/${organizationId || ""}/${projectId}/session/${session.id}`}
                  className="flex items-center justify-between border-b py-1.5 px-2 last-of-type:border-b-0 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span>{getBrowserIcon(browser)}</span>
                      <span className="text-muted-foreground">
                        {getDeviceIcon(deviceType)}
                      </span>
                      <span>{session.pageViewEvents.length} pages</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {formatDistanceToNow(new Date(session.startedAt), {
                        addSuffix: true,
                      })}
                    </Badge>
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

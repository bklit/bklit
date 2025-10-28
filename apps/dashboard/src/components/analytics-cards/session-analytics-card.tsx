import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@bklit/ui/components/item";
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

export async function SessionAnalyticsCard({
  projectId,
  organizationId,
}: SessionAnalyticsCardProps) {
  const sessions = await getRecentSessions(projectId, 5);

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
        <div className="space-y-3">
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
                <Item asChild variant="outline" key={session.id}>
                  <Link
                    href={`/${organizationId || ""}/${projectId}/session/${session.id}`}
                    className="block"
                  >
                    <ItemContent>
                      <ItemTitle>
                        {formatDistanceToNow(new Date(session.startedAt), {
                          addSuffix: true,
                        })}
                      </ItemTitle>
                      <ItemDescription className="flex items-center gap-2">
                        <span>{session.pageViewEvents.length} pages</span>&bull;
                        <span>{formatDuration(session.duration)}</span>&bull;
                        <span>{getBrowserIcon(browser)}</span>&bull;
                        <span>{getDeviceIcon(deviceType)}</span>
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </ItemActions>
                  </Link>
                </Item>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

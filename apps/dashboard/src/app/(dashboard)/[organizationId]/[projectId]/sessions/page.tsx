import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, MapPin, Monitor } from "lucide-react";
import Link from "next/link";
import { getRecentSessions } from "@/actions/session-actions";
import { PageHeader } from "@/components/page-header";
import { Stats } from "@/components/stats";
import { authenticated } from "@/lib/auth";

interface SessionsPageProps {
  params: Promise<{ organizationId: string; projectId: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
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

function getBrowserFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";

  return "Other";
}

function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Mobile")) return "Mobile";
  if (userAgent.includes("Tablet")) return "Tablet";

  return "Desktop";
}

export default async function SessionsPage({
  params,
  searchParams,
}: SessionsPageProps) {
  const { organizationId, projectId } = await params;
  const { page = "1", limit = "20" } = await searchParams;
  await authenticated();

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const offset = (pageNumber - 1) * limitNumber;

  // For now, we'll get all sessions and paginate on the server side
  // In a real app, you'd want to implement proper pagination in the database query
  const allSessions = await getRecentSessions(projectId, 1000); // Get a large number
  const totalSessions = allSessions.length;
  const sessions = allSessions.slice(offset, offset + limitNumber);
  const totalPages = Math.ceil(totalSessions / limitNumber);

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Sessions"
        description={`${totalSessions} total sessions`}
      />
      <div className="container mx-auto py-6 px-4 flex flex-col gap-4">
        {/* Stats Cards */}
        <Stats
          items={[
            {
              icon: Clock,
              name: "Total Sessions",
              stat: totalSessions,
            },
            {
              icon: Monitor,
              name: "Engaged",
              stat: sessions.filter((s) => !s.didBounce).length,
            },
            {
              icon: MapPin,
              name: "Bounced",
              stat: sessions.filter((s) => s.didBounce).length,
            },
            {
              icon: Clock,
              name: "Avg Duration",
              stat: formatDuration(
                Math.round(
                  sessions.reduce((sum, s) => sum + (s.duration || 0), 0) /
                    sessions.length,
                ),
              ),
            },
          ]}
        />

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sessions found
                </p>
              ) : (
                sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/${organizationId}/${projectId}/session/${session.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium">
                            {formatDistanceToNow(new Date(session.startedAt), {
                              addSuffix: true,
                            })}
                          </div>
                          <Badge
                            variant={
                              session.didBounce ? "destructive" : "default"
                            }
                          >
                            {session.didBounce ? "Bounced" : "Engaged"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-x-4">
                          <span>{session.pageViewEvents.length} pages</span>
                          <span>
                            {getBrowserFromUserAgent(session.userAgent)}
                          </span>
                          <span>{getDeviceType(session.userAgent)}</span>
                          {session.country && <span>{session.country}</span>}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm font-medium">
                          {formatDuration(session.duration)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(session.startedAt), "MMM d, HH:mm")}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            {pageNumber > 1 && (
              <Link
                href={`/${organizationId}/${projectId}/analytics/sessions?page=${
                  pageNumber - 1
                }&limit=${limitNumber}`}
                className="px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="px-3 py-2 text-sm text-muted-foreground">
              Page {pageNumber} of {totalPages}
            </span>
            {pageNumber < totalPages && (
              <Link
                href={`/${organizationId}/${projectId}/analytics/sessions?page=${
                  pageNumber + 1
                }&limit=${limitNumber}`}
                className="px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Skeleton } from "@bklit/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bklit/ui/components/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bklit/ui/components/tooltip";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Info } from "lucide-react";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { getBrowserIcon } from "@/lib/utils/get-browser-icon";
import { useTRPC } from "@/trpc/react";

interface RecentEventsTableProps {
  organizationId: string;
  projectId: string;
  trackingId: string;
}

export function RecentEventsTable({
  organizationId,
  projectId,
  trackingId,
}: RecentEventsTableProps) {
  const trpc = useTRPC();

  const [dateParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    { history: "push" },
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) return dateParams.startDate;
    if (!dateParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;

  const { data: event, isLoading } = useQuery(
    trpc.event.getByTrackingId.queryOptions({
      trackingId,
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>
          {isLoading || !event
            ? "Loading event triggers..."
            : `Latest ${event.recentEvents.length} event triggers with session context`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !event ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : event.recentEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No events tracked yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Method
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Automatic</p>
                        <p className="text-xs mb-2">
                          DOM-triggered events (data-attr, ID). User sees and
                          interacts with the element. Counts toward conversion.
                        </p>
                        <p className="font-semibold mb-1">Manual</p>
                        <p className="text-xs">
                          JavaScript-invoked events. May be programmatic, not
                          user-perceived. Doesn't count toward conversion.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead className="text-right">Time Ago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {event.recentEvents.map((trackedEvent) => {
                const metadata = trackedEvent.metadata as {
                  eventType?: string;
                  triggerMethod?: string;
                } | null;
                const triggerMethod = metadata?.triggerMethod || "automatic";

                const session = (
                  trackedEvent as typeof trackedEvent & {
                    session?: {
                      userAgent?: string | null;
                      country?: string | null;
                      city?: string | null;
                    } | null;
                  }
                ).session;

                const userAgent = session?.userAgent || "";
                const browserMatch = userAgent.match(
                  /(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/,
                );
                const browser = browserMatch
                  ? browserMatch[1] || "Other"
                  : userAgent
                    ? "Other"
                    : "-";

                const browserIcon = getBrowserIcon(browser);

                return (
                  <TableRow key={trackedEvent.id}>
                    <TableCell className="font-mono text-sm">
                      {format(
                        new Date(trackedEvent.timestamp),
                        "MMM d, yyyy HH:mm:ss",
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        size="lg"
                        variant={
                          triggerMethod === "automatic"
                            ? "default"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {triggerMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {triggerMethod === "automatic" ? (
                        <Badge variant="success" size="lg">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" size="lg">
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {session?.city && session?.country
                        ? `${session.city}, ${session.country}`
                        : session?.country || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-2">
                        {browserIcon} {browser}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {formatDistanceToNow(new Date(trackedEvent.timestamp), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

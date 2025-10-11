import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Skeleton } from "@bklit/ui/components/skeleton";
import { getTopPages } from "@/actions/analytics-actions";
import type { AnalyticsCardProps } from "@/types/analytics-cards";

type RecentPageViewsCardProps = AnalyticsCardProps;

export async function RecentPageViewsCard({
  projectId,
  userId,
}: RecentPageViewsCardProps) {
  const topPages = await getTopPages({
    projectId,
    userId,
    limit: 5,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Pages</CardTitle>
        <CardDescription>The most popular pages by views.</CardDescription>
      </CardHeader>
      <CardContent>
        {topPages.length > 0 ? (
          <div className="flex flex-col">
            {topPages.map((page) => (
              <div
                key={page.path}
                className="border-b border-border text-sm flex gap-2 h-8 items-center justify-between last-of-type:border-none "
              >
                <div className="text-muted-foreground text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                  {page.path}
                </div>
                <Badge variant="secondary">
                  {page.count} view{page.count !== 1 ? "s" : ""}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p>No page views yet for this project.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentPageViewsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Page Views</CardTitle>
        <CardDescription>
          A list of the most recent page views captured.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(5)].map((_, index) => {
            const key = `skeleton-${index}`;
            return <Skeleton key={key} className="h-12 w-full rounded-md" />;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

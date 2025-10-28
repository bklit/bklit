import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { getTopPages } from "@/actions/analytics-actions";
import type { AnalyticsCardProps } from "@/types/analytics-cards";
import { NoDataCard } from "./no-data-card";

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

  if (topPages.length === 0) {
    return (
      <NoDataCard
        title="Popular Pages"
        description="The most popular pages by views."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Pages</CardTitle>
        <CardDescription>The most popular pages by views.</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

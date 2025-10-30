import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { ProgressRow } from "@bklit/ui/components/progress-row";
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

  const totalViews = topPages.reduce((sum, page) => sum + page.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Pages</CardTitle>
        <CardDescription>The most popular pages by views.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {topPages.map((page) => (
            <ProgressRow
              key={page.path}
              variant="secondary"
              label={page.path}
              value={page.count}
              percentage={(page.count / totalViews) * 100}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

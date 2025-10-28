import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  getAnalyticsStats,
  getLiveUsers,
  getSessionAnalytics,
} from "@/actions/analytics-actions";
import type { SessionAnalyticsSummary } from "@/types/analytics-cards";

interface ViewsCardProps {
  projectId: string;
  userId: string;
}

export async function ViewsCard({ projectId, userId }: ViewsCardProps) {
  const [stats, sessionData, liveUsers] = await Promise.all([
    getAnalyticsStats({ projectId, userId }),
    getSessionAnalytics({ projectId, userId }),
    getLiveUsers({ projectId, userId }),
  ]);

  const sessionStats: SessionAnalyticsSummary = {
    totalSessions: sessionData.totalSessions,
    bounceRate: sessionData.bounceRate,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
        <CardDescription>A quick overview of your app.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">
                {stats.totalViews.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {sessionStats.totalSessions.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Sessions
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {sessionStats.bounceRate}%
              </div>
              <div className="text-sm text-muted-foreground">Bounce Rate</div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <div>
              <div className="text-2xl font-bold">
                {stats.uniqueVisits.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Unique Visitors
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{liveUsers}</div>
              <div className="text-sm text-muted-foreground">Live Users</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

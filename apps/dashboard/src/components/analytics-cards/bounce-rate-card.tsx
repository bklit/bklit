import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { getSessionAnalytics } from "@/actions/analytics-actions";
import { BounceRateChart } from "@/components/analytics-cards/bounce-rate-chart";
import { NoDataCard } from "./no-data-card";

interface BounceRateCardProps {
  projectId: string;
  userId: string;
}

export async function BounceRateCard({
  projectId,
  userId,
}: BounceRateCardProps) {
  const data = await getSessionAnalytics({
    projectId,
    userId,
    days: 30,
  });

  if (data.totalSessions === 0) {
    return (
      <NoDataCard title="Bounce Rate" description="Sessions that bounced" />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.bounceRate}% Bounce Rate</CardTitle>
        <CardDescription>
          {data.bouncedSessions} of {data.totalSessions} sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mt-4 h-[200px]">
          <BounceRateChart
            bouncedSessions={data.bouncedSessions}
            totalSessions={data.totalSessions}
          />
        </div>
      </CardContent>
    </Card>
  );
}

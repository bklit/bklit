import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { MonitorSmartphone } from "lucide-react";
import { getMobileDesktopStats } from "@/actions/analytics-actions";
import { MobileDesktopChart } from "@/components/analytics-cards/mobile-desktop-chart";
import { NoDataCard } from "./no-data-card";

interface MobileDesktopCardProps {
  projectId: string;
  userId: string;
}

export async function MobileDesktopCard({
  projectId,
  userId,
}: MobileDesktopCardProps) {
  const stats = await getMobileDesktopStats({
    projectId,
    userId,
  });

  const totalVisits = stats.desktop + stats.mobile;

  if (totalVisits === 0) {
    return (
      <NoDataCard
        title="Mobile/Desktop"
        description="Unique page visits by device type."
        icon={<MonitorSmartphone size={16} />}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile/Desktop</CardTitle>
        <CardDescription>
          {totalVisits} unique page visits by device type.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MobileDesktopChart desktop={stats.desktop} mobile={stats.mobile} />
      </CardContent>
    </Card>
  );
}

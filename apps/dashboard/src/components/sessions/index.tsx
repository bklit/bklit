import { Clock, MapPin, Monitor } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Stats } from "@/components/stats";
import { api } from "@/trpc/server";
import { SessionsTable } from "./sessions-table";

interface SessionsProps {
  organizationId: string;
  projectId: string;
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

export async function Sessions({ organizationId, projectId }: SessionsProps) {
  // Get sessions using tRPC for stats
  const sessionsData = await api.session.getRecent({
    projectId,
    organizationId,
    limit: 1000, // Get a large number for stats
  });

  const totalSessions = sessionsData.totalCount;
  const allSessions = sessionsData.sessions;

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
              stat: allSessions.filter((s: any) => !s.didBounce).length,
            },
            {
              icon: MapPin,
              name: "Bounced",
              stat: allSessions.filter((s: any) => s.didBounce).length,
            },
            {
              icon: Clock,
              name: "Avg Duration",
              stat: formatDuration(
                Math.round(
                  allSessions.reduce(
                    (sum: number, s: any) => sum + (s.duration || 0),
                    0,
                  ) / allSessions.length,
                ),
              ),
            },
          ]}
        />

        {/* Sessions List */}
        <SessionsTable organizationId={organizationId} projectId={projectId} />
      </div>
    </>
  );
}

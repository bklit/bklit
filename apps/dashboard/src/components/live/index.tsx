import { LiveStatsCard } from "./live-stats-card";

interface LiveProps {
  projectId: string;
  organizationId: string;
}

export const Live = ({ projectId, organizationId }: LiveProps) => {
  return (
    <div className="container grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto">
      <LiveStatsCard projectId={projectId} organizationId={organizationId} />
    </div>
  );
};

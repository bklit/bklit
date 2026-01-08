import { LiveStatsCard } from "./live-stats-card";

interface LiveProps {
  projectId: string;
  organizationId: string;
}

export const Live = ({ projectId, organizationId }: LiveProps) => {
  return (
    <div className="container mx-auto grid grid-cols-1 gap-4 md:grid-cols-3">
      <LiveStatsCard organizationId={organizationId} projectId={projectId} />
    </div>
  );
};

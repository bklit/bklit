import { LiveWrapper } from "@/components/live/live-wrapper";
import { authenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LivePage({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  await authenticated();
  const { organizationId, projectId } = await params;

  return <LiveWrapper organizationId={organizationId} projectId={projectId} />;
}

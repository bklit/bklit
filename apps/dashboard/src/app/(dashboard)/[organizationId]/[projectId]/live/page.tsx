import { redirect } from "next/navigation";
import { LiveWrapper } from "@/components/live/live-wrapper";
import { authenticated } from "@/lib/auth";
import { api } from "@/trpc/server";

export default async function LivePage({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  await authenticated();
  const { organizationId, projectId } = await params;

  const [organization, liveUsers] = await Promise.all([
    api.organization.fetch({ id: organizationId }),
    api.session.liveUsers({ projectId, organizationId }),
  ]);

  if (organization.plan !== "pro" || liveUsers < 1) {
    redirect(`/${organizationId}/${projectId}`);
  }

  return <LiveWrapper organizationId={organizationId} projectId={projectId} />;
}

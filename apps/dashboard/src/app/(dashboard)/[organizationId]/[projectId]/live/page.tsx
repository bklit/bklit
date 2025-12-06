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

  const organization = await api.organization.fetch({ id: organizationId });

  if (organization.plan !== "pro") {
    redirect(`/${organizationId}`);
  }

  return <LiveWrapper projectId={projectId} organizationId={organizationId} />;
}

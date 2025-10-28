import { LiveVisitorToasts } from "@/components/live-visitor-toasts";

export default async function Layout({
  children,
  modal,
  params,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;

  return (
    <div className="w-full flex-1">
      {children}
      {modal}
      <LiveVisitorToasts
        projectId={projectId}
        organizationId={organizationId}
      />
    </div>
  );
}

import type { Metadata } from "next";

// Components
import Modal from "./_modal";

export const metadata: Metadata = {
  title: "Create project",
};

interface CreateProjectModalProps {
  params: Promise<{ organizationId: string }>;
}

export default async function CreateProjectModal({
  params,
}: CreateProjectModalProps) {
  const { organizationId } = await params;
  return <Modal organizationId={organizationId} />;
}

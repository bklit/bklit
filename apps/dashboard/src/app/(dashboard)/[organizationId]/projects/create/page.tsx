"use client";

import { Card, CardContent } from "@bklit/ui/components/card";
import { useRouter } from "next/navigation";
import { use } from "react";
import { AddProjectForm } from "@/components/forms/add-project-form";
import { PageHeader } from "@/components/header/page-header";

interface CreateProjectPageProps {
  params: Promise<{ organizationId: string }>;
}

export default function CreateProjectPage({ params }: CreateProjectPageProps) {
  const { organizationId } = use(params);
  const router = useRouter();

  console.log(
    "🔍 Create Project Page - organizationId from params:",
    organizationId,
  );

  const handleSuccess = (newProjectId?: string) => {
    if (newProjectId) {
      router.push(`/${organizationId}/${newProjectId}`);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Project"
        description="Create a new project for your organization."
      />
      <div className="container mx-auto py-6 px-4 flex gap-4">
        <Card className="w-full max-w-2xl">
          <CardContent>
            <AddProjectForm
              organizationId={organizationId}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

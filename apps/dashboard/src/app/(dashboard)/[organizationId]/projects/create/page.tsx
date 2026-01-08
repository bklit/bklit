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
    organizationId
  );

  const handleSuccess = (newProjectId?: string) => {
    if (newProjectId) {
      router.push(`/${organizationId}/${newProjectId}`);
    }
  };

  return (
    <>
      <PageHeader
        description="Create a new project for your organization."
        title="Create Project"
      />
      <div className="container mx-auto flex gap-4">
        <Card className="w-full max-w-2xl">
          <CardContent>
            <AddProjectForm
              onSuccess={handleSuccess}
              organizationId={organizationId}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

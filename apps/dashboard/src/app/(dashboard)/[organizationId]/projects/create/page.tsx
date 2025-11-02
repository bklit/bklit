import { Card, CardContent } from "@bklit/ui/components/card";
import type { Metadata } from "next";
import { AddProjectForm } from "@/components/forms/add-project-form";
import { PageHeader } from "@/components/header/page-header";

export const metadata: Metadata = {
  title: "Create Project | Bklit",
};

export default function CreateProjectPage() {
  return (
    <>
      <PageHeader
        title="Create Project"
        description="Create a new project for your organization."
      />
      <div className="container mx-auto py-6 px-4 flex gap-4">
        <Card className="w-full max-w-2xl">
          <CardContent>
            <AddProjectForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

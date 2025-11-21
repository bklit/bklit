import { Card, CardContent } from "@bklit/ui/components/card";
import type { Metadata } from "next";
import { AddOrganizationForm } from "@/components/forms/add-organization-form";
import { PageHeader } from "@/components/header/page-header";

export const metadata: Metadata = {
  title: "Create Workspace | Bklit",
};

export default function CreateOrganizationPage() {
  return (
    <>
      <PageHeader
        title="Create Workspace"
        description="Create your new workspace"
      />
      <div className="container mx-auto flex gap-4">
        <Card className="w-full max-w-2xl">
          <CardContent>
            <AddOrganizationForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

"use client";

import { Button } from "@bklit/ui/components/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateApiTokenForm } from "@/components/forms/create-api-token-form";

interface CreateTokenButtonProps {
  organizationId: string;
}

export function CreateTokenButton({ organizationId }: CreateTokenButtonProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button onClick={() => setIsCreateDialogOpen(true)}>
        <Plus className="mr-2 size-4" />
        Create Token
      </Button>

      <CreateApiTokenForm
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          router.refresh();
        }}
        organizationId={organizationId}
      />
    </>
  );
}

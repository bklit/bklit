"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddProjectForm } from "@/components/forms/add-project-form";

interface ModalProps {
  organizationId: string;
}

export default function Modal({ organizationId }: ModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleSuccess = (newProjectId?: string) => {
    if (newProjectId) {
      setOpen(false);
      setTimeout(() => {
        router.push(`/${organizationId}/${newProjectId}`);
      }, 150);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(false);
      setTimeout(() => {
        router.back();
      }, 150);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add project</DialogTitle>
        </DialogHeader>
        <AddProjectForm
          onSuccess={handleSuccess}
          organizationId={organizationId}
        />
      </DialogContent>
    </Dialog>
  );
}

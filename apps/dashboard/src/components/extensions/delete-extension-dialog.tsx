"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { Input } from "@bklit/ui/components/input";
import { Label } from "@bklit/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/react";

export function DeleteExtensionDialog({
  extension,
  open,
  onClose,
  organizationId,
  projectId,
  onSuccess,
}: {
  extension: { id: string; name: string } | null;
  open: boolean;
  onClose: () => void;
  organizationId: string;
  projectId: string;
  onSuccess: () => void;
}) {
  const trpc = useTRPC();
  const [confirmation, setConfirmation] = useState("");

  const removeMutation = useMutation(
    trpc.extension.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Extension removed");
        setConfirmation("");
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleConfirmRemove = () => {
    if (!extension || confirmation !== extension.name) {
      toast.error("Extension name does not match");
      return;
    }

    removeMutation.mutate({
      organizationId,
      extensionId: extension.id,
      projectIds: [projectId],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Extension: {extension?.name}</DialogTitle>
          <DialogDescription>
            This will remove the extension from this project. To confirm, please
            enter "<span className="font-semibold">{extension?.name}</span>"
            below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="confirmation">Extension Name</Label>
          <Input
            id="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={extension?.name}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmRemove}
            disabled={
              removeMutation.isPending || confirmation !== extension?.name
            }
          >
            {removeMutation.isPending ? "Removing..." : "Remove Extension"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

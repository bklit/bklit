"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bklit/ui/components/dialog";
import { Input } from "@bklit/ui/components/input";
import { Label } from "@bklit/ui/components/label";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteProjectAction, type FormState } from "@/actions/project-actions";
import { authClient } from "@/auth/client";

interface DeleteProjectFormProps {
  projectId: string;
  projectName: string;
}

const initialState: FormState = {
  success: false,
  message: "",
};

export function DeleteProjectForm({
  projectId,
  projectName,
}: DeleteProjectFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [state, formAction] = useActionState(deleteProjectAction, initialState);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
        setIsOpen(false);
        setConfirmationInput("");

        router.refresh();

        if (session?.user?.id) {
          queryClient.invalidateQueries({
            queryKey: ["userProjectCount", session.user.id],
          });
        }

        router.push("/");
      } else {
        toast.error(state.message);
      }
    }
  }, [state, router, queryClient, session]);

  const handleSubmitDeletion = () => {
    if (confirmationInput === projectName) {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("confirmedProjectName", confirmationInput);
      startTransition(() => {
        formAction(formData);
      });
    } else {
      toast.error(
        "Project name does not match. Please type it correctly to confirm."
      );
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setConfirmationInput("");
    }
  }, [isOpen]);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="destructive">
          Delete project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Project: {projectName}</DialogTitle>
          <DialogDescription>
            To permanently delete this project and all associated data, please
            enter &quot;
            <span className="font-semibold">{projectName}</span>&quot; below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              className="sr-only text-right"
              htmlFor="project-name-confirmation"
            >
              Project Name
            </Label>
            <Input
              className="col-span-4"
              id="project-name-confirmation"
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={projectName}
              value={confirmationInput}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={isPending || confirmationInput !== projectName}
            onClick={handleSubmitDeletion}
            variant="destructive"
          >
            {isPending ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

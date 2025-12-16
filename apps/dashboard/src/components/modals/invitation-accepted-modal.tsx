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
import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useTRPC } from "@/trpc/react";

export function InvitationAcceptedModal({
  organizationId,
}: {
  organizationId: string | null;
}) {
  const [invited, setInvited] = useQueryState("invited", parseAsBoolean);
  const router = useRouter();
  const trpc = useTRPC();

  // Fetch organizations client-side
  const { data: organizations = [] } = useQuery(
    trpc.organization.list.queryOptions(),
  );

  const newOrganization = organizations.find(
    (org) => org.id === organizationId,
  );
  const open = invited === true && !!organizationId && !!newOrganization;

  const handleNavigate = () => {
    setInvited(null);
    if (organizationId && newOrganization) {
      const project = newOrganization.projects[0];
      if (project) {
        router.push(`/${organizationId}/${project.id}`);
      } else {
        // Fallback to organization dashboard if no projects exist
        router.push(`/${organizationId}`);
      }
    }
  };

  const handleClose = () => {
    setInvited(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto size-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-xl text-center">
            Welcome to {newOrganization?.name}!
          </DialogTitle>
          <DialogDescription className="text-center">
            You've successfully joined this workspace. Start exploring analytics
            and collaborating with your team.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Stay Here
          </Button>
          <Button onClick={handleNavigate}>Go to Workspace</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

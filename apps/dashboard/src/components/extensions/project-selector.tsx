"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import { Checkbox } from "@bklit/ui/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { Input } from "@bklit/ui/components/input";
import { Label } from "@bklit/ui/components/label";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  activatedProjectIds?: string[];
  onActivate: (projectIds: string[]) => void;
  onRemove?: (projectId: string, projectName: string) => void;
  isLoading?: boolean;
}

export function ProjectSelector({
  projects,
  activatedProjectIds = [],
  onActivate,
  onRemove,
  isLoading,
}: ProjectSelectorProps) {
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [deactivateDialog, setDeactivateDialog] = useState<{
    projectId: string;
    projectName: string;
  } | null>(null);
  const [confirmationInput, setConfirmationInput] = useState("");

  const handleToggle = (projectId: string, projectName: string) => {
    const isActivated = activatedProjectIds.includes(projectId);

    if (isActivated) {
      // Show confirmation dialog for deactivation
      setDeactivateDialog({ projectId, projectName });
    } else {
      // Toggle selection for new projects
      setSelectedProjects((prev) => {
        const next = new Set(prev);
        if (next.has(projectId)) {
          next.delete(projectId);
        } else {
          next.add(projectId);
        }
        return next;
      });
    }
  };

  const handleConfirmDeactivate = () => {
    if (
      !deactivateDialog ||
      confirmationInput !== deactivateDialog.projectName ||
      !onRemove
    ) {
      return;
    }

    onRemove(deactivateDialog.projectId, deactivateDialog.projectName);
    setDeactivateDialog(null);
    setConfirmationInput("");
  };

  const handleCancelDeactivate = () => {
    setDeactivateDialog(null);
    setConfirmationInput("");
  };

  const nonActivatedProjects = projects.filter(
    (p) => !activatedProjectIds.includes(p.id)
  );

  const handleToggleAll = () => {
    if (selectedProjects.size === nonActivatedProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(nonActivatedProjects.map((p) => p.id)));
    }
  };

  const handleActivate = () => {
    onActivate(Array.from(selectedProjects));
    setSelectedProjects(new Set()); // Clear selection after activating
  };

  const hasNonActivatedSelection = Array.from(selectedProjects).some(
    (id) => !activatedProjectIds.includes(id)
  );

  return (
    <div className="space-y-4">
      {nonActivatedProjects.length > 0 && (
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-base">Select Projects</Label>
          <Button
            disabled={isLoading}
            onClick={handleToggleAll}
            size="sm"
            variant="ghost"
          >
            {selectedProjects.size === nonActivatedProjects.length
              ? "Deselect All"
              : "Select All"}
          </Button>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto">
        {projects.map((project) => {
          const isActivated = activatedProjectIds.includes(project.id);
          const isSelected = selectedProjects.has(project.id);

          return (
            <Label
              className="flex cursor-pointer items-center justify-between space-x-2 rounded-xl bg-bklit-500/50 px-2.5 py-2 transition-colors hover:bg-bklit-500"
              htmlFor={project.id}
              key={project.id}
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isActivated || isSelected}
                  disabled={isLoading}
                  id={project.id}
                  onCheckedChange={() => handleToggle(project.id, project.name)}
                />
                <span className="cursor-pointer font-normal text-sm">
                  {project.name}
                </span>
              </div>
              {isActivated && <Badge variant="success">Active</Badge>}
            </Label>
          );
        })}
      </div>

      {hasNonActivatedSelection && selectedProjects.size > 0 && (
        <Button
          className="w-full"
          disabled={isLoading}
          onClick={handleActivate}
        >
          {isLoading
            ? "Activating..."
            : `Activate for ${selectedProjects.size} project${selectedProjects.size !== 1 ? "s" : ""}`}
        </Button>
      )}

      <Dialog
        onOpenChange={(open) => !open && handleCancelDeactivate()}
        open={!!deactivateDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deactivate Extension</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this extension from{" "}
              <span className="font-semibold">
                {deactivateDialog?.projectName}
              </span>
              ? To confirm, please type the project name below.
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
                placeholder={deactivateDialog?.projectName}
                value={confirmationInput}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={handleCancelDeactivate} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              disabled={confirmationInput !== deactivateDialog?.projectName}
              onClick={handleConfirmDeactivate}
              variant="destructive"
            >
              Deactivate Extension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

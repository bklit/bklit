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
    new Set(),
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
    (p) => !activatedProjectIds.includes(p.id),
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
    (id) => !activatedProjectIds.includes(id),
  );

  return (
    <div className="space-y-4">
      {nonActivatedProjects.length > 0 && (
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Select Projects</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleAll}
            disabled={isLoading}
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
              key={project.id}
              htmlFor={project.id}
              className="flex items-center justify-between space-x-2 bg-bklit-500/50 py-2 px-2.5 rounded-xl cursor-pointer hover:bg-bklit-500 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={project.id}
                  checked={isActivated || isSelected}
                  onCheckedChange={() => handleToggle(project.id, project.name)}
                  disabled={isLoading}
                />
                <span className="text-sm font-normal cursor-pointer">
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
          onClick={handleActivate}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading
            ? "Activating..."
            : `Activate for ${selectedProjects.size} project${selectedProjects.size !== 1 ? "s" : ""}`}
        </Button>
      )}

      <Dialog
        open={!!deactivateDialog}
        onOpenChange={(open) => !open && handleCancelDeactivate()}
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
                htmlFor="project-name-confirmation"
                className="text-right sr-only"
              >
                Project Name
              </Label>
              <Input
                id="project-name-confirmation"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={deactivateDialog?.projectName}
                className="col-span-4"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={handleCancelDeactivate}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDeactivate}
              disabled={confirmationInput !== deactivateDialog?.projectName}
            >
              Deactivate Extension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { Button } from "@bklit/ui/components/button";
import { Checkbox } from "@bklit/ui/components/checkbox";
import { Label } from "@bklit/ui/components/label";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  onActivate: (projectIds: string[]) => void;
  isLoading?: boolean;
}

export function ProjectSelector({ projects, onActivate, isLoading }: ProjectSelectorProps) {
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  const handleToggle = (projectId: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map((p) => p.id)));
    }
  };

  const handleActivate = () => {
    onActivate(Array.from(selectedProjects));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Select Projects</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleAll}
          disabled={isLoading}
        >
          {selectedProjects.size === projects.length ? "Deselect All" : "Select All"}
        </Button>
      </div>

      <div className="space-y-2 border rounded-lg p-4">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center space-x-2">
            <Checkbox
              id={project.id}
              checked={selectedProjects.has(project.id)}
              onCheckedChange={() => handleToggle(project.id)}
              disabled={isLoading}
            />
            <Label
              htmlFor={project.id}
              className="text-sm font-normal cursor-pointer"
            >
              {project.name}
            </Label>
          </div>
        ))}
      </div>

      <Button
        onClick={handleActivate}
        disabled={selectedProjects.size === 0 || isLoading}
        className="w-full"
      >
        {isLoading
          ? "Activating..."
          : `Activate for ${selectedProjects.size} project${selectedProjects.size !== 1 ? "s" : ""}`}
      </Button>
    </div>
  );
}


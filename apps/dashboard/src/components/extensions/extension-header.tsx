import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";
import { Separator } from "@bklit/ui/components/separator";
import { Puzzle } from "lucide-react";
import Image from "next/image";
import { ProjectSelector } from "@/components/extensions/project-selector";

interface Project {
  id: string;
  name: string;
}

interface ExtensionHeaderProps {
  extensionId: string;
  displayName: string;
  description: string;
  author: string;
  version: string;
  category: string;
  isPro: boolean;
  icon?: string;
  projects?: Project[];
  activatedProjectIds?: string[];
  onActivate?: (projectIds: string[]) => void;
  onRemove?: (projectId: string, projectName: string) => void;
  isActivating?: boolean;
}

export function ExtensionHeader({
  extensionId,
  displayName,
  description,
  author,
  version,
  category,
  isPro,
  icon,
  projects,
  activatedProjectIds,
  onActivate,
  onRemove,
  isActivating,
}: ExtensionHeaderProps) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-lg border bg-card p-6">
      <div className="flex flex-col gap-2">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {icon ? (
            <Image
              alt={displayName}
              className="size-16 object-cover"
              height={64}
              src={`/extensions/${extensionId}/${icon.replace("./", "")}`}
              width={64}
            />
          ) : (
            <Puzzle className="size-8" />
          )}
        </div>
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h1 className="font-bold text-2xl">{displayName}</h1>
            {isPro && <Badge variant="outline">Pro</Badge>}
            <Badge className="text-xs" variant="secondary">
              v{version}
            </Badge>
          </div>
          <p className="mb-2 text-muted-foreground">{description}</p>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Avatar className="size-4">
                <AvatarImage
                  alt={author}
                  src={`https://github.com/${author}.png`}
                />
                <AvatarFallback className="text-[8px]">
                  {author.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm">{author}</span>
            </div>
            <Separator orientation="vertical" />
            <Badge className="text-xs capitalize" variant="secondary">
              {category}
            </Badge>
          </div>
        </div>
      </div>
      {projects && onActivate && (
        <div className="flex flex-col space-y-4 rounded-lg bg-bklit-600 p-6">
          <div className="flex flex-col space-y-2">
            <span className="font-semibold text-base">Activate Extension</span>

            <span className="text-muted-foreground text-sm">
              Select which projects should use this extension.
            </span>
          </div>

          <ProjectSelector
            activatedProjectIds={activatedProjectIds}
            isLoading={isActivating}
            onActivate={onActivate}
            onRemove={onRemove}
            projects={projects}
          />
        </div>
      )}
    </div>
  );
}

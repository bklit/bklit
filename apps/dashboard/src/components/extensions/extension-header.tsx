import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
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
    <div className="grid grid-cols-2 gap-4 p-6 rounded-lg border bg-card">
      <div className="flex flex-col gap-2">
        <div className="flex size-16 items-center justify-center rounded-lg border bg-muted overflow-hidden">
          {icon ? (
            <Image
              src={`/extensions/${extensionId}/${icon.replace("./", "")}`}
              alt={displayName}
              width={64}
              height={64}
              className="size-16 object-cover"
            />
          ) : (
            <Puzzle className="size-8" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {isPro && <Badge variant="outline">Pro</Badge>}
            <Badge variant="secondary" className="text-xs">
              v{version}
            </Badge>
          </div>
          <p className="text-muted-foreground mb-2">{description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="size-4">
                <AvatarImage
                  src={`https://github.com/${author}.png`}
                  alt={author}
                />
                <AvatarFallback className="text-[8px]">
                  {author.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold">{author}</span>
            </div>
            <Separator orientation="vertical" />
            <Badge variant="secondary" className="text-xs capitalize">
              {category}
            </Badge>
          </div>
        </div>
      </div>
      {projects && onActivate && (
        <div className="flex flex-col bg-bklit-600 p-6 rounded-lg space-y-4">
          <div className="flex flex-col space-y-2">
            <span className="text-base font-semibold">Activate Extension</span>

            <span className="text-sm text-muted-foreground">
              Select which projects should use this extension.
            </span>
          </div>

          <ProjectSelector
            projects={projects}
            activatedProjectIds={activatedProjectIds}
            onActivate={onActivate}
            onRemove={onRemove}
            isLoading={isActivating}
          />
        </div>
      )}
    </div>
  );
}

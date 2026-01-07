"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Switch } from "@bklit/ui/components/switch";
import { Pencil, Puzzle } from "lucide-react";
import Image from "next/image";

interface ExtensionCardMiniProps {
  extensionId: string;
  displayName: string;
  description: string;
  icon?: string;
  enabled: boolean;
  onEdit: () => void;
  onToggle: (enabled: boolean) => void;
}

export function ExtensionCardMini({
  extensionId,
  displayName,
  description,
  icon,
  enabled,
  onEdit,
  onToggle,
}: ExtensionCardMiniProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted overflow-hidden">
            {icon ? (
              <Image
                src={`/extensions/${extensionId}/${icon.replace("./", "")}`}
                alt={displayName}
                width={48}
                height={48}
                className="size-12 object-cover"
              />
            ) : (
              <Puzzle className="size-6" />
            )}
          </div>
          <div>
            <CardTitle>{displayName}</CardTitle>
          </div>
        </div>
        <CardAction className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={onToggle} />
          <Button onClick={onEdit} variant="outline" size="icon">
            <Pencil className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm">{description}</CardContent>
    </Card>
  );
}

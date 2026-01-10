import type { ExtensionMetadata } from "@bklit/extensions";
import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Puzzle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ExtensionDirectoryCardProps {
  extension: ExtensionMetadata & { id: string };
}

export function ExtensionDirectoryCard({
  extension,
}: ExtensionDirectoryCardProps) {
  const iconPath = extension.icon
    ? `/extensions/${extension.id}/${extension.icon.replace("./metadata/", "")}`
    : null;

  return (
    <Link href={`/extensions/${extension.id}`}>
      <Card className="group h-full transition-all hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {iconPath ? (
                <Image
                  alt={extension.displayName}
                  className="size-12 object-cover"
                  height={48}
                  src={iconPath}
                  width={48}
                />
              ) : (
                <Puzzle className="size-6" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                {extension.displayName}
                {extension.isPro && (
                  <Badge className="text-xs" variant="default">
                    Pro
                  </Badge>
                )}
              </CardTitle>
              <p className="text-muted-foreground text-xs">
                By {extension.author}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2">
            {extension.description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

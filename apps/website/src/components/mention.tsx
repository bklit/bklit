import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";

interface MentionProps {
  url: string;
  github?: string;
  children: React.ReactNode;
}

export function Mention({ url, github, children }: MentionProps) {
  return (
    <Badge asChild size="lg" variant="outline">
      <a
        className="relative top-[2px]"
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {github && (
          <Avatar className="size-4">
            <AvatarImage
              alt={github}
              src={`https://github.com/${github}.png`}
            />
            <AvatarFallback className="text-[8px]">
              {github[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        {children}
      </a>
    </Badge>
  );
}

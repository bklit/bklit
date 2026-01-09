import { Avatar, AvatarFallback, AvatarImage } from "@bklit/ui/components/avatar";
import Link from "next/link";

interface MentionProps {
  url: string;
  github?: string;
  children: React.ReactNode;
}

export function Mention({ url, github, children }: MentionProps) {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-medium text-sm no-underline transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
    >
      {github && (
        <Avatar className="size-4">
          <AvatarImage
            src={`https://github.com/${github}.png`}
            alt={github}
          />
          <AvatarFallback className="text-[8px]">
            {github[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {children}
    </Link>
  );
}


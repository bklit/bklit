"use client";

import { cn } from "@bklit/ui/lib/utils";
import { CircleFlag } from "react-circle-flags";

interface NotificationCardProps {
  className?: string;
  title: string;
  description: string;
  countryCode: string;
}

function NotificationCard({
  className,
  title,
  description,
  countryCode,
}: NotificationCardProps) {
  return (
    <div
      className={cn(
        "-skew-y-[4deg] relative flex h-auto w-[320px] select-none flex-col rounded-lg border border-border bg-background p-4 shadow-lg backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <CircleFlag className="size-4" countryCode={countryCode} />
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-medium text-foreground text-sm leading-tight">
            {title}
          </p>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
    </div>
  );
}

export const Notifications = () => {
  const notifications = [
    {
      id: "jp-visitor",
      title: "New live visitor from Japan, Tokyo.",
      description: "Viewing on desktop",
      countryCode: "jp",
      className: "[grid-area:stack] border-red-500",
    },
    {
      id: "us-visitor",
      title: "New live visitor from United States, San Francisco.",
      description: "Viewing on desktop",
      countryCode: "us",
      className: "[grid-area:stack] translate-x-12 translate-y-10",
    },
    {
      id: "gb-visitor",
      title: "New live visitor from United Kingdom, London.",
      description: "Viewing on mobile",
      countryCode: "gb",
      className: "[grid-area:stack] translate-x-24 translate-y-20",
    },
    {
      id: "de-visitor",
      title: "New live visitor from Germany, Berlin.",
      description: "Viewing on desktop",
      countryCode: "de",
      className: "[grid-area:stack] translate-x-36 translate-y-30",
    },
    {
      id: "fr-visitor",
      title: "New live visitor from France, Paris.",
      description: "Viewing on mobile",
      countryCode: "fr",
      className:
        "[grid-area:stack] translate-x-48 translate-y-40 border-yellow-500",
    },
  ];

  return (
    <div className="-ml-12 grid place-items-center opacity-100 [grid-template-areas:'stack']">
      {notifications.map((notification) => (
        <NotificationCard
          className={notification.className}
          countryCode={notification.countryCode}
          description={notification.description}
          key={notification.id}
          title={notification.title}
        />
      ))}
    </div>
  );
};

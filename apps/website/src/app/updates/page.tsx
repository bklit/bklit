import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { updatesSource } from "@/lib/updates-source";

export const metadata: Metadata = {
  title: "Updates & Changelog - Bklit Analytics",
  description:
    "Stay up to date with the latest features, improvements, and updates to Bklit Analytics.",
};

const UPDATES_PER_PAGE = 30;

export default async function UpdatesPage() {
  const allUpdates = updatesSource.getPages();

  // Sort updates by date (newest first)
  const sortedUpdates = allUpdates.sort((a, b) => {
    const dateA = new Date(a.data.date as string).getTime();
    const dateB = new Date(b.data.date as string).getTime();
    return dateB - dateA;
  });

  // Get first 30 updates
  const updates = sortedUpdates.slice(0, UPDATES_PER_PAGE);
  const hasMore = sortedUpdates.length > UPDATES_PER_PAGE;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="font-bold text-4xl tracking-tight lg:text-5xl">
            Updates & Changelog
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Stay up to date with the latest features, improvements, and updates
            to Bklit Analytics.
          </p>
        </div>
      </div>

      {/* Updates List */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {updates.map((update) => {
            const date = new Date(update.data.date as string);
            const formattedDate = date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <Link
                className="group transition-transform hover:scale-[1.01]"
                href={update.url}
                key={update.url}
              >
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <time
                          className="text-muted-foreground text-sm"
                          dateTime={update.data.date as string}
                        >
                          {formattedDate}
                        </time>
                        {update.data.tags &&
                          Array.isArray(update.data.tags) &&
                          update.data.tags.map((tag) => (
                            <Badge key={tag} size="default" variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                      </div>
                      <CardTitle className="transition-colors group-hover:text-primary">
                        {update.data.title}
                      </CardTitle>
                      {update.data.author && (
                        <CardDescription>
                          by {update.data.author}
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  {update.data.image && (
                    <CardContent>
                      <Image
                        alt={update.data.title}
                        className="rounded-lg"
                        height={400}
                        src={update.data.image as string}
                        width={800}
                      />
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        {hasMore && (
          <div className="mt-12 flex justify-center">
            <Link
              className="rounded-lg border bg-card px-6 py-3 font-medium text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              href="/updates/page/2"
            >
              Older Updates →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

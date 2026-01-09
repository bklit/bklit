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
import { notFound } from "next/navigation";
import { updatesSource } from "@/lib/updates-source";

interface PageProps {
  params: Promise<{ page: string }>;
}

const UPDATES_PER_PAGE = 30;

export async function generateStaticParams() {
  const allUpdates = updatesSource.getPages();
  const totalPages = Math.ceil(allUpdates.length / UPDATES_PER_PAGE);

  return Array.from({ length: totalPages }, (_, i) => ({
    page: String(i + 1),
  }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const pageNum = Number.parseInt(params.page, 10);

  return {
    title: `Updates & Changelog - Page ${pageNum} - Bklit Analytics`,
    description:
      "Stay up to date with the latest features, improvements, and updates to Bklit Analytics.",
  };
}

export default async function UpdatesPagePaginated(props: PageProps) {
  const params = await props.params;
  const pageNum = Number.parseInt(params.page, 10);

  if (Number.isNaN(pageNum) || pageNum < 1) {
    notFound();
  }

  const allUpdates = updatesSource.getPages();

  // Sort updates by date (newest first)
  const sortedUpdates = allUpdates.sort((a, b) => {
    const dateA = new Date(a.data.date).getTime();
    const dateB = new Date(b.data.date).getTime();
    return dateB - dateA;
  });

  const totalPages = Math.ceil(sortedUpdates.length / UPDATES_PER_PAGE);

  if (pageNum > totalPages) {
    notFound();
  }

  // Calculate pagination
  const startIndex = (pageNum - 1) * UPDATES_PER_PAGE;
  const endIndex = startIndex + UPDATES_PER_PAGE;
  const updates = sortedUpdates.slice(startIndex, endIndex);

  const hasNewer = pageNum > 1;
  const hasOlder = pageNum < totalPages;

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
            to Bklit Analytics. (Page {pageNum} of {totalPages})
          </p>
        </div>
      </div>

      {/* Updates List */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {updates.map((update) => {
            const date = new Date(update.data.date);
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
                          dateTime={update.data.date}
                        >
                          {formattedDate}
                        </time>
                        {update.data.tags.map((tag) => (
                          <Badge key={tag} size="default" variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <CardTitle className="transition-colors group-hover:text-primary">
                        {update.data.title}
                      </CardTitle>
                      <CardDescription>
                        by {update.data.author}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  {update.data.image && (
                    <CardContent>
                      <Image
                        alt={update.data.title}
                        className="rounded-lg"
                        height={400}
                        src={update.data.image}
                        width={800}
                      />
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Pagination Navigation */}
        <div className="mt-12 flex items-center justify-center gap-4">
          {hasNewer && (
            <Link
              className="rounded-lg border bg-card px-6 py-3 font-medium text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              href={pageNum === 2 ? "/updates" : `/updates/page/${pageNum - 1}`}
            >
              ← Newer Updates
            </Link>
          )}
          {hasOlder && (
            <Link
              className="rounded-lg border bg-card px-6 py-3 font-medium text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              href={`/updates/page/${pageNum + 1}`}
            >
              Older Updates →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

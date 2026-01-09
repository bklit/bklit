import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";
import { format } from "date-fns";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/copy-link-button";
import { getMDXComponents } from "@/lib/mdx-components";
import { SectionHeader } from "@/components/section-header";
import { UpdatesMonthTicker } from "@/components/updates-month-ticker";
import { getAllUpdates } from "@/lib/updates";

interface PageProps {
  params: Promise<{ page: string }>;
}

const UPDATES_PER_PAGE = 2;

export async function generateStaticParams() {
  const allUpdates = getAllUpdates();
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

  const allUpdates = getAllUpdates();
  const totalPages = Math.ceil(allUpdates.length / UPDATES_PER_PAGE);

  if (pageNum > totalPages) {
    notFound();
  }

  // Calculate pagination
  const startIndex = (pageNum - 1) * UPDATES_PER_PAGE;
  const endIndex = startIndex + UPDATES_PER_PAGE;
  const updates = allUpdates.slice(startIndex, endIndex);

  const hasNewer = pageNum > 1;
  const hasOlder = pageNum < totalPages;

  return (
    <main className="flex min-h-screen w-full flex-col gap-32">
      <UpdatesMonthTicker
        updates={updates.map((u) => ({
          slug: u.slug,
          date: u.frontmatter.date,
        }))}
      />
      <div className="container mx-auto flex max-w-4xl flex-col space-y-12 px-4 py-48">
        <SectionHeader
          description="Recent updates, releases and events."
          title="Updates"
        />

        {/* Updates List */}
        <div className="space-y-16">
          {updates.map((update) => {
            const formattedDate = format(
              new Date(update.frontmatter.date),
              "MMMM d, yyyy"
            );
            const updateUrl =
              process.env.NODE_ENV === "development"
                ? `http://localhost:3001/updates/${update.slug}`
                : `${process.env.BKLIT_WEBSITE_URL}/updates/${update.slug}`;

            return (
              <article key={update.slug} id={update.slug} className="space-y-6">
                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  <time
                    className="text-muted-foreground text-sm"
                    dateTime={update.frontmatter.date}
                  >
                    {formattedDate}
                  </time>
                  {(update.frontmatter.tags || ["update"]).map((tag) => (
                    <Badge key={tag} size="default" variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Title */}
                <h2 className="font-bold text-3xl tracking-tight">
                  {update.frontmatter.title}
                </h2>

                {/* Image */}
                {update.frontmatter.image && (
                  <Image
                    alt={update.frontmatter.title}
                    className="w-full rounded-lg"
                    height={448}
                    src={update.frontmatter.image}
                    width={896}
                  />
                )}

                {/* Content */}
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <MDXRemote
                    source={update.content}
                    components={getMDXComponents()}
                  />
                </div>

                {/* Footer: Avatar + Author + Copy Link */}
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarImage
                        alt={update.frontmatter.author}
                        src={`https://github.com/${update.frontmatter.author}.png`}
                      />
                      <AvatarFallback>
                        {update.frontmatter.author[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground text-sm">
                      {update.frontmatter.author}
                    </span>
                  </div>
                  <CopyLinkButton url={updateUrl} />
                </div>
              </article>
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
    </main>
  );
}

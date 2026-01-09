import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { format } from "date-fns";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { CopyLinkButton } from "@/components/copy-link-button";
import { SectionHeader } from "@/components/section-header";
import { UpdatesMonthTicker } from "@/components/updates-month-ticker";
import { getMDXComponents } from "@/lib/mdx-components";
import { getAllUpdates } from "@/lib/updates";

export const metadata: Metadata = {
  title: "Updates & Changelog - Bklit Analytics",
  description:
    "Stay up to date with the latest features, improvements, and updates to Bklit Analytics.",
};

const UPDATES_PER_PAGE = 30;

export default function UpdatesPage() {
  const allUpdates = getAllUpdates();
  const updates = allUpdates.slice(0, UPDATES_PER_PAGE);
  const hasMore = allUpdates.length > UPDATES_PER_PAGE;

  return (
    <main className="flex min-h-screen w-full flex-col gap-32">
      <UpdatesMonthTicker
        updates={updates.map((u) => ({
          slug: u.slug,
          date: u.frontmatter.date,
        }))}
      />
      <div className="container mx-auto flex max-w-3xl flex-col space-y-12 px-4 py-48">
        <SectionHeader
          description="Recent updates, releases and events."
          title="Updates"
        />

        {/* Updates List */}
        <div className="space-y-32">
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
              <article
                className="article space-y-6"
                id={update.slug}
                key={update.slug}
              >
                <div className="flex flex-col space-y-3">
                  {/* Tags */}
                  <time
                    className="text-muted-foreground text-sm"
                    dateTime={update.frontmatter.date}
                  >
                    {formattedDate}
                  </time>

                  {/* Title */}
                  <h2 className="font-bold text-4xl tracking-tight">
                    {update.frontmatter.title}
                  </h2>
                </div>

                {/* Image */}
                {update.frontmatter.image && (
                  <Image
                    alt={update.frontmatter.title}
                    className="w-full rounded-lg"
                    height={448}
                    src={update.frontmatter.image}
                    width={896}
                    unoptimized
                  />
                )}

                {/* Content */}
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <MDXRemote
                    components={getMDXComponents()}
                    source={update.content}
                  />
                </div>

                {/* Footer: Avatar + Author + Copy Link */}
                <div className="flex items-center justify-between border-b py-6">
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
    </main>
  );
}

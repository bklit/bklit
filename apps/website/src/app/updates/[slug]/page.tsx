import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import { format } from "date-fns";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { CopyLinkButton } from "@/components/copy-link-button";
import { SectionHeader } from "@/components/section-header";
import { getMDXComponents } from "@/lib/mdx-components";
import { getAllUpdates, getUpdateBySlug } from "@/lib/updates";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const updates = getAllUpdates();
  return updates.map((update) => ({
    slug: update.slug,
  }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const update = getUpdateBySlug(params.slug);

  if (!update) {
    return {
      title: "Update Not Found",
    };
  }

  return {
    title: `${update.frontmatter.title} - Bklit Analytics`,
    description: update.frontmatter.title,
    openGraph: {
      title: update.frontmatter.title,
      description: update.frontmatter.title,
      images: update.frontmatter.image ? [update.frontmatter.image] : [],
    },
  };
}

export default async function UpdatePage(props: PageProps) {
  const params = await props.params;
  const update = getUpdateBySlug(params.slug);

  if (!update) {
    notFound();
  }

  const formattedDate = format(
    new Date(update.frontmatter.date),
    "MMMM d, yyyy"
  );
  const updateUrl =
    process.env.NODE_ENV === "development"
      ? `http://localhost:3001/updates/${update.slug}`
      : `${process.env.BKLIT_WEBSITE_URL}/updates/${update.slug}`;

  return (
    <main className="flex min-h-screen w-full flex-col gap-32">
      <article className="container mx-auto flex max-w-3xl flex-col space-y-12 px-4 py-48">
        <SectionHeader
          // description={formattedDate}
          title={update.frontmatter.title}
        >
          {(update.frontmatter.tags || ["update"]).map((tag) => (
            <Badge
              className="capitalize"
              key={tag}
              size="default"
              variant="secondary"
            >
              {tag}
            </Badge>
          ))}
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
        </SectionHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <time
              className="text-muted-foreground text-sm"
              dateTime={update.frontmatter.date}
            >
              {formattedDate}
            </time>
          </div>

          {/* Image */}
          {update.frontmatter.image && (
            <Image
              alt={update.frontmatter.title}
              className="w-full rounded-lg"
              height={448}
              priority
              src={update.frontmatter.image}
              width={896}
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

          <Button asChild variant="outline">
            <Link href="/updates">More updates</Link>
          </Button>
        </div>
      </article>
    </main>
  );
}

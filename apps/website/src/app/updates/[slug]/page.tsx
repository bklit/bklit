import { Badge } from "@bklit/ui/components/badge";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/lib/mdx-components";
import { updatesSource } from "@/lib/updates-source";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return updatesSource.getPages().map((page) => ({
    slug: page.slugs.join("/"),
  }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const page = updatesSource.getPage([params.slug]);

  if (!page) {
    return {
      title: "Update Not Found",
    };
  }

  return {
    title: `${page.data.title} - Bklit Analytics`,
    description: page.data.description || page.data.title,
    openGraph: {
      title: page.data.title,
      description: page.data.description || page.data.title,
      images: page.data.image ? [page.data.image as string] : [],
    },
  };
}

export default async function UpdatePage(props: PageProps) {
  const params = await props.params;
  const page = updatesSource.getPage([params.slug]);

  if (!page) {
    notFound();
  }

  const MDX = page.data.body;
  const date = new Date(page.data.date as string);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-muted-foreground text-sm">
            <Link
              className="transition-colors hover:text-foreground"
              href="/updates"
            >
              Updates
            </Link>
            <span>/</span>
            <span className="text-foreground">{page.data.title}</span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <time
              className="text-muted-foreground text-sm"
              dateTime={page.data.date as string}
            >
              {formattedDate}
            </time>
            {page.data.tags &&
              Array.isArray(page.data.tags) &&
              page.data.tags.map((tag) => (
                <Badge key={tag} size="default" variant="secondary">
                  {tag}
                </Badge>
              ))}
          </div>
          <h1 className="mb-4 font-bold text-4xl tracking-tight lg:text-5xl">
            {page.data.title}
          </h1>
          {page.data.author && (
            <p className="text-muted-foreground">by {page.data.author}</p>
          )}
        </header>

        {/* Featured Image */}
        {page.data.image && (
          <div className="mb-8">
            <Image
              alt={page.data.title}
              className="w-full rounded-lg"
              height={448}
              priority
              src={page.data.image as string}
              width={896}
            />
          </div>
        )}

        {/* MDX Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <MDX components={getMDXComponents()} />
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t pt-8">
          <Link
            className="inline-flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="/updates"
          >
            ← Back to all updates
          </Link>
        </footer>
      </article>
    </div>
  );
}

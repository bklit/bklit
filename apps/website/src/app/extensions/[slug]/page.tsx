import { extensionRegistry } from "@bklit/extensions";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Separator } from "@bklit/ui/components/separator";
import type { Metadata } from "next";
import { Puzzle } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ExtensionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ExtensionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const extension = extensionRegistry.get(slug);

  if (!extension) {
    return {
      title: "Extension Not Found",
    };
  }

  return {
    title: `${extension.metadata.displayName} - Bklit Extensions`,
    description: extension.metadata.description,
  };
}

export default async function ExtensionDetailPage({
  params,
}: ExtensionDetailPageProps) {
  const { slug } = await params;
  const extension = extensionRegistry.get(slug);

  if (!extension) {
    notFound();
  }

  // Try to load README content
  let readmeContent: string | null = null;
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const readmePath = path.join(
      process.cwd(),
      "..",
      "..",
      "packages",
      "extensions",
      slug,
      "README.md"
    );
    readmeContent = await fs.readFile(readmePath, "utf-8");
  } catch {
    // README doesn't exist or can't be read
  }

  const iconPath = extension.metadata.icon
    ? `/extensions/${slug}/${extension.metadata.icon.replace("./metadata/", "")}`
    : null;

  const categoryLabels = {
    notifications: "Notifications",
    analytics: "Analytics",
    marketing: "Marketing",
    other: "Other",
  };

  return (
    <main className="flex min-h-screen w-full flex-col">
      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-24 md:py-32">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {iconPath ? (
                <Image
                  alt={extension.metadata.displayName}
                  className="size-16 object-cover"
                  height={64}
                  src={iconPath}
                  width={64}
                />
              ) : (
                <Puzzle className="size-8" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-3xl">
                  {extension.metadata.displayName}
                </h1>
                {extension.metadata.isPro && (
                  <Badge variant="default">Pro</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-lg">
                {extension.metadata.description}
              </p>
            </div>
          </div>
          <Button asChild size="lg" variant="mono">
            <a href="https://app.bklit.com/signup">Get Started</a>
          </Button>
        </div>

        {/* Metadata */}
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-sm">Category</p>
              <p className="font-medium">
                {categoryLabels[extension.metadata.category]}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Version</p>
              <p className="font-medium">{extension.metadata.version}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Author</p>
              <p className="font-medium">{extension.metadata.author}</p>
            </div>
            {extension.metadata.rateLimit && (
              <div>
                <p className="text-muted-foreground text-sm">Rate Limit</p>
                <p className="font-medium">
                  {extension.metadata.rateLimit.eventsPerHour.toLocaleString()}/hr
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* README Content */}
        {readmeContent ? (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <MDXRemote source={readmeContent} />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>About {extension.metadata.displayName}</CardTitle>
              <CardDescription>
                {extension.metadata.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This extension helps you integrate Bklit with{" "}
                {extension.metadata.displayName}. Sign up to get started and
                configure this extension in your project settings.
              </p>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Ready to get started?</CardTitle>
            <CardDescription>
              Sign up for Bklit and activate this extension in your project.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild size="lg" variant="default">
              <a href="https://app.bklit.com/signup">Sign Up</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/extensions">Browse Extensions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


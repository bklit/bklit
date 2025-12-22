import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/notebook/page";
import type { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/lib/mdx-components";
import { source } from "@/lib/source";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  // Get the icon component from lucide-react if specified
  const iconName = page.data.icon as keyof typeof Icons;
  const Icon: LucideIcon | null =
    iconName && Icons[iconName] ? (Icons[iconName] as LucideIcon) : null;

  return (
    <DocsPage full={page.data.full} toc={page.data.toc}>
      <DocsTitle className="flex items-center gap-2">
        {Icon && <Icon className="size-6" />}
        {page.data.title}
      </DocsTitle>
      {page.data.description && (
        <DocsDescription>{page.data.description}</DocsDescription>
      )}
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

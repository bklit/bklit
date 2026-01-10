"use client";

import { CodeBlockClient } from "@bklit/ui/components/code-block-client";
import type { BundledLanguage } from "shiki";

interface MDXCodeBlockProps {
  children: string;
  className?: string;
}

export function MDXCodeBlock({ children, className }: MDXCodeBlockProps) {
  // Extract language from className (e.g., "language-typescript" -> "typescript")
  const language = className?.replace(/language-/, "") as BundledLanguage;

  // If no language is specified, it's inline code
  if (!language) {
    return (
      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
        {children}
      </code>
    );
  }

  // Use "text" for plain text blocks to get consistent styling
  const displayLanguage = language || "text";

  return (
    <CodeBlockClient language={displayLanguage}>{children}</CodeBlockClient>
  );
}

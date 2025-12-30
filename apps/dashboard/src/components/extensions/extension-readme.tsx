"use client";

import { Card, CardContent } from "@bklit/ui/components/card";
import { useEffect, useState } from "react";
import { Skeleton } from "@bklit/ui/components/skeleton";

interface ExtensionReadmeProps {
  extensionId: string;
}

export function ExtensionReadme({ extensionId }: ExtensionReadmeProps) {
  const [readme, setReadme] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/extensions/${extensionId}/README.md`)
      .then((res) => {
        if (!res.ok) throw new Error("README not found");
        return res.text();
      })
      .then((text) => {
        setReadme(text);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [extensionId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!readme) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(readme) }}
        />
      </CardContent>
    </Card>
  );
}

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-10 mb-4">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-muted rounded text-sm">$1</code>');

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>');

  // Lists
  html = html.replace(/^\d+\.\s(.*)$/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/^-\s(.*)$/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/(<li class="ml-4">.*<\/li>\n?)+/g, '<ul class="list-disc list-inside space-y-1 my-2">$&</ul>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="my-3">');
  html = '<p class="my-3">' + html + '</p>';

  return html;
}


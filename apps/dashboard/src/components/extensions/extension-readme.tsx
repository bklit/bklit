"use client";

import { CodeBlockClient } from "@bklit/ui/components/code-block-client";
import { Skeleton } from "@bklit/ui/components/skeleton";
import DOMPurify from "dompurify";
import { useEffect, useState } from "react";

type SupportedLanguage =
  | "javascript"
  | "typescript"
  | "bash"
  | "json"
  | "html"
  | "css"
  | "python"
  | "text";

interface ExtensionReadmeProps {
  extensionId: string;
}

interface ParsedContent {
  type: "html" | "code";
  content: string;
  language?: SupportedLanguage;
}

// Regex patterns for markdown parsing (performance optimization)
const CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/g;
const H3_REGEX = /^### (.*$)/gim;
const H2_REGEX = /^## (.*$)/gim;
const H1_REGEX = /^# (.*$)/gim;
const BOLD_REGEX = /\*\*(.*?)\*\*/g;
const INLINE_CODE_REGEX = /`([^`]+)`/g;
const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;
const NUMBERED_LIST_REGEX = /^\d+\.\s/;
const NESTED_LIST_REGEX = /^\s{2,}-\s/;
const UNORDERED_LIST_REGEX = /^-\s/;
const HTML_TAG_REGEX = /^<[hpul]/;

export function ExtensionReadme({ extensionId }: ExtensionReadmeProps) {
  const [content, setContent] = useState<ParsedContent[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/extensions/${extensionId}/README.md`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("README not found");
        }
        return res.text();
      })
      .then((text) => {
        setContent(parseMarkdown(text));
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [extensionId]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="markdown-block space-y-4 rounded-lg border border-border bg-card p-6">
      {content.map((block, index) => {
        if (block.type === "code" && block.language) {
          return (
            <CodeBlockClient key={index} language={block.language as any}>
              {block.content}
            </CodeBlockClient>
          );
        }
        return (
          <div
            className="space-y-4"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(block.content, {
                ALLOWED_TAGS: [
                  "h1",
                  "h2",
                  "h3",
                  "p",
                  "strong",
                  "code",
                  "ul",
                  "ol",
                  "li",
                  "a",
                  "div",
                ],
                ALLOWED_ATTR: ["class", "href", "target", "rel"],
              }),
            }}
            key={index}
          />
        );
      })}
    </div>
  );
}

// Parse markdown into blocks (text and code)
function parseMarkdown(markdown: string): ParsedContent[] {
  const blocks: ParsedContent[] = [];
  const codeBlockRegex = CODE_BLOCK_REGEX;

  let lastIndex = 0;
  let match: RegExpExecArray | null = codeBlockRegex.exec(markdown);

  while (match !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = markdown.slice(lastIndex, match.index);
      const html = convertMarkdownToHtml(textContent);
      if (html.trim()) {
        blocks.push({ type: "html", content: html });
      }
    }

    // Add code block
    const language = (match[1] || "text") as SupportedLanguage;
    const code = (match[2] || "").trim();
    blocks.push({ type: "code", content: code, language });

    lastIndex = match.index + match[0].length;
    match = codeBlockRegex.exec(markdown);
  }

  // Add remaining text
  if (lastIndex < markdown.length) {
    const textContent = markdown.slice(lastIndex);
    const html = convertMarkdownToHtml(textContent);
    if (html.trim()) {
      blocks.push({ type: "html", content: html });
    }
  }

  return blocks;
}

// Convert markdown to HTML (excluding code blocks)
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(H3_REGEX, '<h3 class="text-lg font-semibold">$1</h3>');
  html = html.replace(H2_REGEX, '<h2 class="text-xl font-bold mt-2">$1</h2>');
  html = html.replace(H1_REGEX, '<h1 class="text-2xl font-bold">$1</h1>');

  // Bold
  html = html.replace(BOLD_REGEX, "<strong>$1</strong>");

  // Inline code
  html = html.replace(
    INLINE_CODE_REGEX,
    '<code class="px-2 py-1.5 bg-bklit-800/50 rounded text-sm font-mono text-primary">$1</code>'
  );

  // Links
  html = html.replace(
    LINK_REGEX,
    '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Process lists line by line to handle nesting
  const lines = html.split("\n");
  const processed: string[] = [];
  let inOrderedList = false;
  let inUnorderedList = false;
  let inNestedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      continue;
    }
    const nextLine = lines[i + 1];

    // Numbered list items
    if (NUMBERED_LIST_REGEX.test(line)) {
      if (!inOrderedList) {
        processed.push(
          '<ol class="list-decimal list-inside space-y-2 my-3 ml-4">'
        );
        inOrderedList = true;
      }
      const content = line?.replace(NUMBERED_LIST_REGEX, "") || "";
      processed.push(
        `<li class="leading-relaxed text-muted-foreground">${content}</li>`
      );

      // Check if next line is a nested list
      if (nextLine && NESTED_LIST_REGEX.test(nextLine)) {
        processed.push(
          '<ul class="list-disc list-inside space-y-1 ml-6 mt-1">'
        );
        inNestedList = true;
      }

      if (
        !(
          nextLine &&
          (nextLine.match(NUMBERED_LIST_REGEX) ||
            nextLine.match(NESTED_LIST_REGEX))
        )
      ) {
        if (inNestedList) {
          processed.push("</ul>");
          inNestedList = false;
        }
        if (!nextLine?.match(NUMBERED_LIST_REGEX)) {
          processed.push("</ol>");
          inOrderedList = false;
        }
      }
    }
    // Nested list items (indented with spaces)
    else if (line && NESTED_LIST_REGEX.test(line)) {
      const content = line?.replace(NESTED_LIST_REGEX, "") || "";
      processed.push(
        `<li class="text-sm leading-relaxed text-muted-foreground">${content}</li>`
      );

      if (!nextLine?.match(NESTED_LIST_REGEX)) {
        processed.push("</ul>");
        inNestedList = false;
      }
    }
    // Top-level unordered list items
    else if (line && UNORDERED_LIST_REGEX.test(line)) {
      if (!inUnorderedList) {
        processed.push(
          '<ul class="list-disc list-inside space-y-2 my-3 ml-4">'
        );
        inUnorderedList = true;
      }
      const content = line?.replace(UNORDERED_LIST_REGEX, "") || "";
      processed.push(
        `<li class="leading-relaxed text-muted-foreground">${content}</li>`
      );

      if (!nextLine?.match(UNORDERED_LIST_REGEX)) {
        processed.push("</ul>");
        inUnorderedList = false;
      }
    }
    // Regular lines
    else if (line) {
      if (line.trim() !== "" && !line.match(HTML_TAG_REGEX)) {
        processed.push(
          `<p class="leading-relaxed text-muted-foreground">${line}</p>`
        );
      } else if (line.match(HTML_TAG_REGEX)) {
        processed.push(line);
      }
      // Skip empty lines entirely
    }
  }

  return processed.join("\n");
}

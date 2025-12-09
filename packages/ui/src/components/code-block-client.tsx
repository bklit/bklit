"use client";

import { cn } from "@bklit/ui/lib/utils";
import { useEffect, useState } from "react";
import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";

interface Props {
  children: string;
  language: BundledLanguage;
  lineNumbers?: boolean;
  footer?: React.ReactNode;
}

export function CodeBlockClient(props: Props) {
  const { children, lineNumbers = false, language, footer } = props;
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function highlightCode() {
      try {
        const html = await codeToHtml(children, {
          lang: language,
          theme: "nord",
        });

        if (isMounted) {
          setHighlightedCode(html);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to highlight code:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    highlightCode();

    return () => {
      isMounted = false;
    };
  }, [children, language]);

  if (isLoading) {
    return (
      <div className="rounded-lg overflow-clip">
        <pre data-custom-codeblock>{children}</pre>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "bg-card border-white dark:border-input w-full min-w-0 rounded-md border p-3 text-xs [&_pre]:overflow-auto [&_pre]:leading-5! [&_pre]:bg-card! [&_pre]:p-3 [&_pre]:text-xs ",
          footer ? "rounded-b-none" : "rounded-lg",
        )}
        data-line-numbers={lineNumbers ? "true" : "false"}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
      {footer && (
        <div className="text-xs text-muted-foreground p-3 border-input border-x border-b rounded-b-md bg-bklit-800/50">
          {footer}
        </div>
      )}
    </>
  );
}

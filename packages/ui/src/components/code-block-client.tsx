"use client";

import { cn } from "@bklit/ui/lib/utils";
import { useTheme } from "next-themes";
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
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function highlightCode() {
      try {
        const html = await codeToHtml(children, {
          lang: language,
          theme: resolvedTheme === "light" ? "min-light" : "nord",
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
  }, [children, language, resolvedTheme]);

  if (isLoading) {
    return (
      <div className="overflow-clip rounded-lg">
        <pre data-custom-codeblock>{children}</pre>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "w-full min-w-0 rounded-md border border-white bg-card p-3 text-xs dark:border-input [&_pre]:overflow-auto [&_pre]:bg-card! [&_pre]:p-3 [&_pre]:text-xs [&_pre]:leading-5!",
          footer ? "rounded-b-none" : "rounded-lg"
        )}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
        data-line-numbers={lineNumbers ? "true" : "false"}
      />
      {footer && (
        <div className="rounded-b-md border-input border-x border-b bg-bklit-800/50 p-3 text-muted-foreground text-xs">
          {footer}
        </div>
      )}
    </>
  );
}

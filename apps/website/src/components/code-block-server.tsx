import { cn } from "@bklit/ui/lib/utils";
import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";

interface CodeBlockServerProps {
  children: string;
  language: BundledLanguage;
  footer?: string;
}

export async function CodeBlockServer({
  children,
  language,
  footer,
}: CodeBlockServerProps) {
  const highlightedCode = await codeToHtml(children, {
    lang: language,
    theme: "nord",
  });

  return (
    <>
      <div
        className={cn(
          "w-full min-w-0 rounded-md border border-white bg-card p-3 text-xs dark:border-input [&_pre]:overflow-auto [&_pre]:bg-card! [&_pre]:p-3 [&_pre]:text-xs [&_pre]:leading-5!",
          footer ? "rounded-b-none" : "rounded-lg"
        )}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
      {footer && (
        <div className="rounded-b-md border-input border-x border-b bg-bklit-800/50 p-3 text-muted-foreground text-xs">
          {footer}
        </div>
      )}
    </>
  );
}


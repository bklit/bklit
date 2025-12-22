"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@bklit/ui/components/context-menu";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import Link from "next/link";
import { useState } from "react";
import { brandingSnippets } from "../lib/branding-snippets";

export const LogoDropdown = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link className="flex cursor-pointer items-center gap-3" href="/">
          <BklitLogo size={38} variant="mono" />
          <span className="font-bold text-2xl">Bklit</span>
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => copyToClipboard(brandingSnippets.svg, "svg")}
        >
          {copied === "svg" ? "Copied!" : "Copy SVG"}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => copyToClipboard(brandingSnippets.react, "react")}
        >
          {copied === "react" ? "Copied!" : "Copy React"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem asChild>
          <a download href="/bklit-branding.zip" title="Download branding zip">
            Download Zip
          </a>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

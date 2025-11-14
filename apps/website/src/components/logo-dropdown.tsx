"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bklit/ui/components/dropdown-menu";
import { BklitLogo } from "@bklit/ui/icons/bklit";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 cursor-pointer">
          <BklitLogo size={38} className="dark:text-white text-black" />
          <span className="text-2xl font-bold">Bklit</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => copyToClipboard(brandingSnippets.svg, "svg")}
        >
          {copied === "svg" ? "Copied!" : "Copy SVG"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => copyToClipboard(brandingSnippets.react, "react")}
        >
          {copied === "react" ? "Copied!" : "Copy React"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/bklit-branding.zip" download title="Download branding zip">
            Download Zip
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


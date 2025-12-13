import { BklitLogo } from "@bklit/ui/icons/bklit";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Github, MessageCircle, Twitter } from "lucide-react";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <BklitLogo size={32} className="dark:text-white text-black" />
          <span className="text-lg font-semibold">Bklit Docs</span>
        </div>
      ),
      url: "/",
      links: [
        {
          text: "GitHub",
          url: "https://github.com/bklit/bklit",
          external: true,
          icon: <Github size={16} />,
        },
        {
          text: "X",
          url: "https://x.com/bklitai",
          external: true,
          icon: <Twitter size={16} />,
        },
        {
          text: "Discord",
          url: "https://discord.gg/GFfD67gZGf",
          external: true,
          icon: <MessageCircle size={16} />,
        },
      ],
    },
  };
}

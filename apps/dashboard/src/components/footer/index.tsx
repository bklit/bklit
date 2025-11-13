import { Badge } from "@bklit/ui/components/badge";
import { Separator } from "@bklit/ui/components/separator";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="bg-background p-4 border-t">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2">
            <Link href="/">
              <BklitLogo size={32} />
            </Link>
            <Separator orientation="vertical" />
            <Link href="/">Home</Link>
            <Link href="/">Docs</Link>
            <Link href="/">Guides</Link>
            <Link href="/">SDK</Link>
          </nav>

          <nav className="flex items-center gap-2">
            <Badge>Systems online</Badge>
          </nav>
        </div>
      </div>
    </footer>
  );
};

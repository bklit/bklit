import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import Link from "next/link";

export interface NavItems {
  items: NavItem[];
}

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  variant:
    | "default"
    | "ghost"
    | "outline"
    | "secondary"
    | "destructive"
    | "link";
  badge?: {
    label: string;
    variant: "default" | "secondary" | "destructive";
  };
}

export function NavSide({ items }: NavItems) {
  return (
    <nav className="flex flex-col gap-px">
      {items.map((item) => (
        <Button
          key={item.label}
          variant={item.variant}
          asChild
          className="justify-start"
        >
          <Link href={item.href}>
            {item.icon && item.icon}
            {item.label}
            {item.badge && (
              <Badge variant={item.badge.variant}>{item.badge.label}</Badge>
            )}
          </Link>
        </Button>
      ))}
    </nav>
  );
}

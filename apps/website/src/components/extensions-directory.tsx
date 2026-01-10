"use client";

import type { ExtensionMetadata } from "@bklit/extensions";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@bklit/ui/components/command";
import { Input } from "@bklit/ui/components/input";
import { BarChart, Bell, Mail, Puzzle, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { ExtensionDirectoryCard } from "./extension-directory-card";

interface ExtensionsDirectoryProps {
  extensions: Array<ExtensionMetadata & { id: string }>;
}

type CategoryId = "all" | "notifications" | "analytics" | "marketing";

const categories: Array<{
  id: CategoryId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "all", label: "All Extensions", icon: Sparkles },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "analytics", label: "Analytics", icon: BarChart },
  { id: "marketing", label: "Marketing", icon: Mail },
];

export function ExtensionsDirectory({ extensions }: ExtensionsDirectoryProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useQueryState(
    "category",
    parseAsStringLiteral([
      "all",
      "notifications",
      "analytics",
      "marketing",
    ] as const).withDefault("all")
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredExtensions = extensions.filter((ext) => {
    const matchesCategory =
      selectedCategory === "all" || ext.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      ext.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === "all") {
      return extensions.length;
    }
    return extensions.filter((ext) => ext.category === categoryId).length;
  };

  return (
    <>
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden w-full md:block lg:w-64">
          <nav className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  className="w-full justify-start"
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={
                    selectedCategory === category.id ? "secondary" : "ghost"
                  }
                >
                  <Icon className="mr-2 size-4" />
                  {category.label}
                  <span className="ml-auto text-muted-foreground text-xs">
                    {getCategoryCount(category.id)}
                  </span>
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              className="cursor-pointer pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => setCommandOpen(true)}
              placeholder="Search extensions..."
              readOnly
              value={searchQuery}
            />
            <kbd className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 hidden items-center rounded border bg-muted px-2 py-0.5 font-mono text-muted-foreground text-sm md:inline-flex">
              <span className="relative top-px mr-px text-[19px]">⌘</span>K
            </kbd>
          </div>

          {/* Extensions grid */}
          {filteredExtensions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No extensions found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredExtensions.map((extension) => (
                <ExtensionDirectoryCard
                  extension={extension}
                  key={extension.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Command Palette */}
      <CommandDialog
        className="border"
        description="Search for extensions"
        onOpenChange={setCommandOpen}
        open={commandOpen}
        title="Search Extensions"
      >
        <CommandInput placeholder="Search extensions..." />
        <CommandList>
          <CommandEmpty>No extensions found.</CommandEmpty>
          <CommandGroup heading="Extensions">
            {extensions.map((extension) => {
              const iconPath = extension.icon
                ? `/extensions/${extension.id}/${extension.icon.replace("./metadata/", "")}`
                : null;

              return (
                <CommandItem
                  key={extension.id}
                  onSelect={() => {
                    router.push(`/extensions/${extension.id}`);
                    setCommandOpen(false);
                  }}
                  value={`${extension.displayName} ${extension.description}`}
                >
                  <div className="flex size-8 items-center justify-center overflow-hidden rounded border bg-muted">
                    {iconPath ? (
                      <Image
                        alt={extension.displayName}
                        className="size-8 object-cover"
                        height={32}
                        src={iconPath}
                        width={32}
                      />
                    ) : (
                      <Puzzle className="size-4" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{extension.displayName}</span>
                    <span className="text-muted-foreground text-xs">
                      {extension.description}
                    </span>
                  </div>
                  {extension.isPro && (
                    <Badge className="ml-auto text-xs" variant="default">
                      Pro
                    </Badge>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

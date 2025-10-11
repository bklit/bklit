"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@bklit/ui/components/command";
import {
  SearchDialog,
  SearchDialogContent,
  SearchDialogTrigger,
} from "@bklit/ui/components/search-dialog";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSearchData } from "@/hooks/use-search-data";

interface SearchItem {
  value: string;
  label: string;
  href: string;
}

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { currentOrganization, allOrganizations, isLoading } = useSearchData();

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SearchDialog open={open} onOpenChange={setOpen}>
      <SearchDialogTrigger>
        <div className="group flex items-center justify-between w-48 gap-2 dark:bg-input/30 border-input hover:border-bklit-500 h-9 rounded-md border bg-transparent pl-3 pr-1.5 py-1 text-base shadow-xs transition-[color,box-shadow,border] outline-none md:text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <SearchIcon
              size={16}
              className="group-hover:text-bklit-100 transition"
            />
            <span>Search&hellip;</span>
          </div>
          <div className="flex items-center gap-1 font-semibold">
            <kbd className="inline-flex items-center justify-center w-fit h-6 px-1.5 font-sans text-xs border border-bklit-500 rounded-[4px] text-muted-foreground/70 group-hover:text-muted-foreground transition">
              ⌘
            </kbd>
            <kbd className="inline-flex items-center justify-center w-fit h-6 px-1.5 font-sans text-xs border border-bklit-500 rounded-[4px] text-muted-foreground/70 group-hover:text-muted-foreground transition">
              K
            </kbd>
          </div>
        </div>
      </SearchDialogTrigger>
      <SearchDialogContent>
        <Command>
          <div className="flex items-center pr-1.5 w-full">
            <div className="flex-1 w-full">
              <CommandInput placeholder="Search&hellip;" />
            </div>
            <kbd className="flex items-center justify-center h-6 px-1 text-xs font-mono border border-bklit-500 rounded-[4px] text-muted-foreground">
              Esc
            </kbd>
          </div>
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No results found."}
            </CommandEmpty>
            <div className="pt-2 space-y-1">
              {currentOrganization.map((group) => (
                <CommandGroup key={group.heading} heading={group.heading}>
                  {group.items.map((item: SearchItem) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => {
                        handleSelect(item.href);
                      }}
                    >
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              {allOrganizations.map((group) => (
                <CommandGroup key={group.heading} heading={group.heading}>
                  {group.items.map((item: SearchItem) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => {
                        handleSelect(item.href);
                      }}
                    >
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </div>
          </CommandList>
        </Command>
      </SearchDialogContent>
    </SearchDialog>
  );
}

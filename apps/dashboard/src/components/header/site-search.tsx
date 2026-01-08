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
    <SearchDialog onOpenChange={setOpen} open={open}>
      <SearchDialogTrigger>
        <div className="group hidden h-9 w-48 items-center justify-between gap-2 rounded-md border border-input bg-transparent py-1 pr-1.5 pl-3 text-base shadow-xs outline-none transition-[color,box-shadow,border] hover:border-bklit-500 sm:flex md:text-sm dark:bg-input/30">
          <div className="flex items-center gap-2 text-muted-foreground">
            <SearchIcon
              className="transition group-hover:text-bklit-100"
              size={16}
            />
            <span>Search&hellip;</span>
          </div>
          <div className="flex items-center gap-1 font-semibold">
            <kbd className="inline-flex h-6 w-fit items-center justify-center rounded-[4px] border border-bklit-500 px-1.5 font-sans text-muted-foreground/70 text-xs transition group-hover:text-muted-foreground">
              ⌘
            </kbd>
            <kbd className="inline-flex h-6 w-fit items-center justify-center rounded-[4px] border border-bklit-500 px-1.5 font-sans text-muted-foreground/70 text-xs transition group-hover:text-muted-foreground">
              K
            </kbd>
          </div>
        </div>
      </SearchDialogTrigger>
      <SearchDialogContent>
        <Command>
          <div className="flex w-full items-center pr-1.5">
            <div className="w-full flex-1">
              <CommandInput placeholder="Search&hellip;" />
            </div>
            <kbd className="flex h-6 items-center justify-center rounded-[4px] border border-bklit-500 px-1 font-mono text-muted-foreground text-xs">
              Esc
            </kbd>
          </div>
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No results found."}
            </CommandEmpty>
            <div className="space-y-1 pt-2">
              {currentOrganization.map((group) => (
                <CommandGroup heading={group.heading} key={group.heading}>
                  {group.items.map((item: SearchItem) => (
                    <CommandItem
                      key={item.value + item.label}
                      onSelect={() => {
                        handleSelect(item.href);
                      }}
                      value={item.value}
                    >
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              {allOrganizations.map((group) => (
                <CommandGroup heading={group.heading} key={group.heading}>
                  {group.items.map((item: SearchItem) => (
                    <CommandItem
                      key={item.value + item.label}
                      onSelect={() => {
                        handleSelect(item.href);
                      }}
                      value={item.value}
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

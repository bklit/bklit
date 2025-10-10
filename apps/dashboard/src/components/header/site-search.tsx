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
import { useState } from "react";

const currentOrganization = [
  {
    heading: "Organization1",
    items: [
      {
        value: "overview",
        label: "Overview",
      },
      {
        value: "settings",
        label: "Settings",
      },
      {
        value: "billing",
        label: "Billing",
      },
    ],
  },
  {
    heading: "Organization1 projects",
    items: [
      {
        value: "project-1",
        label: "Project 1",
      },
      {
        value: "project-2",
        label: "Project 2",
      },
    ],
  },
];

const searchItems = [
  {
    heading: "Your organizations",
    items: [
      {
        value: "organization-1",
        label: "Organization 1",
      },
      {
        value: "organization-2",
        label: "Organization 2",
      },
    ],
  },
];

export function SiteSearch() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
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
          <kbd className="flex items-center justify-center w-6 h-6 text-xs font-mono border border-bklit-500 rounded-[4px] text-muted-foreground">
            F
          </kbd>
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
            <CommandEmpty>No framework found.</CommandEmpty>
            {currentOrganization.map((item) => (
              <CommandGroup heading={item.heading}>
                {item.items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {searchItems.map((item) => (
              <CommandGroup heading={item.heading}>
                {item.items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </SearchDialogContent>
    </SearchDialog>
  );
}

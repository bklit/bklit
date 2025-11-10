"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@bklit/ui/components/toggle-group";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(value) => {
        if (value) setTheme(value);
      }}
      size="sm"
      variant="outline"
    >
      <ToggleGroupItem
        value="light"
        aria-label="Toggle light mode"
        className="p-3"
      >
        <Sun className="size-3" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        aria-label="Toggle dark mode"
        className="p-3"
      >
        <Moon className="size-3" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="system"
        aria-label="Toggle system mode"
        className="p-3"
      >
        <Monitor className="size-3" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

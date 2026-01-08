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
      onValueChange={(value) => {
        if (value) {
          setTheme(value);
        }
      }}
      size="sm"
      type="single"
      value={theme}
      variant="outline"
    >
      <ToggleGroupItem
        aria-label="Toggle light mode"
        className="p-3"
        value="light"
      >
        <Sun className="size-3" />
      </ToggleGroupItem>
      <ToggleGroupItem
        aria-label="Toggle dark mode"
        className="p-3"
        value="dark"
      >
        <Moon className="size-3" />
      </ToggleGroupItem>
      <ToggleGroupItem
        aria-label="Toggle system mode"
        className="p-3"
        value="system"
      >
        <Monitor className="size-3" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import { useEffect, useMemo, useState } from "react";

interface SankeyNivoProps {
  data: {
    nodes: Array<{ id: string }>;
    links: Array<{ source: string; target: string; value: number }>;
  };
  className?: string;
  colors?: {
    entry?: string;
    passThrough?: string;
    exit?: string;
  };
  labelColor?: string | "theme" | "auto";
}

function SankeyNodeTooltip({
  node,
}: {
  node: { id: string; label?: string; value?: number; color?: string };
}) {
  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{node.label || node.id}</div>
      {node.value !== undefined && (
        <div className="flex items-center gap-2">
          {node.color && (
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: node.color }}
            />
          )}
          <div className="flex flex-1 items-center justify-between leading-none">
            <span className="text-muted-foreground">Sessions</span>
            <span className="font-medium font-mono text-foreground tabular-nums">
              {node.value.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function SankeyLinkTooltip({
  link,
}: {
  link: {
    source: { id: string; label?: string; color?: string };
    target: { id: string; label?: string; color?: string };
    value: number;
    color?: string;
  };
}) {
  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">
        {link.source.label || link.source.id} →{" "}
        {link.target.label || link.target.id}
      </div>
      <div className="flex items-center gap-2">
        {link.color && (
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: link.color }}
          />
        )}
        <div className="flex flex-1 items-center justify-between leading-none">
          <span className="text-muted-foreground">Sessions</span>
          <span className="font-medium font-mono text-foreground tabular-nums">
            {link.value.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper to resolve CSS variables to actual color values
function resolveCSSVariable(variable: string): string {
  if (typeof window === "undefined") {
    return variable;
  }

  if (variable.startsWith("var(")) {
    const varName = variable.match(/var\(([^)]+)\)/)?.[1];
    if (varName) {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(varName.trim())
        .trim();
      return value || variable;
    }
  }
  return variable;
}

// Helper to darken a color (simple RGB darkening)
function darkenColor(color: string, amount: number): string {
  // If it's already a hex color or rgb, we can darken it
  // For simplicity, we'll use CSS filter or return a darker version
  // This is a basic implementation - you might want to use a color library
  if (color.startsWith("#")) {
    const num = Number.parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
    const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
    const b = Math.max(0, (num & 0xff) * (1 - amount));
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
  // For other formats, return the color with opacity or use CSS
  return color;
}

export function SankeyNivo({
  data,
  className,
  colors: customColors,
  labelColor = "auto",
}: SankeyNivoProps) {
  const defaultColors = {
    entry: "var(--chart-2)",
    passThrough: "var(--chart-1)",
    exit: "var(--chart-3)",
  };

  // Resolve CSS variables to actual color values
  const [resolvedColors, setResolvedColors] = useState({
    entry: resolveCSSVariable(customColors?.entry || defaultColors.entry),
    passThrough: resolveCSSVariable(
      customColors?.passThrough || defaultColors.passThrough
    ),
    exit: resolveCSSVariable(customColors?.exit || defaultColors.exit),
  });

  const [resolvedLabelColor, setResolvedLabelColor] = useState<string | null>(
    labelColor === "theme" ? resolveCSSVariable("var(--foreground)") : null
  );

  useEffect(() => {
    // Re-resolve colors when custom colors change or on mount
    setResolvedColors({
      entry: resolveCSSVariable(customColors?.entry || defaultColors.entry),
      passThrough: resolveCSSVariable(
        customColors?.passThrough || defaultColors.passThrough
      ),
      exit: resolveCSSVariable(customColors?.exit || defaultColors.exit),
    });

    // Re-resolve label color
    if (labelColor === "theme") {
      setResolvedLabelColor(resolveCSSVariable("var(--foreground)"));
    } else if (labelColor !== "auto") {
      setResolvedLabelColor(labelColor);
    } else {
      setResolvedLabelColor(null); // null means use function
    }
  }, [
    customColors?.entry,
    customColors?.passThrough,
    customColors?.exit,
    labelColor,
  ]);

  const colors = resolvedColors;

  const chartData = useMemo(() => {
    if (!(data.nodes.length && data.links.length)) {
      return null;
    }

    const validLinks = data.links.filter((link) => {
      const sourceExists = data.nodes.some((node) => node.id === link.source);
      const targetExists = data.nodes.some((node) => node.id === link.target);
      const isSelfLoop = link.source === link.target;
      const isValid =
        sourceExists &&
        targetExists &&
        !isSelfLoop &&
        Number.isFinite(link.value) &&
        link.value > 0;

      return isValid;
    });

    if (validLinks.length === 0) {
      return null;
    }

    const transformed = {
      nodes: data.nodes,
      links: validLinks,
    };

    console.log("SankeyNivo Chart Data:", {
      nodes: transformed.nodes,
      links: transformed.links,
      nodeCount: transformed.nodes.length,
      linkCount: transformed.links.length,
    });

    return transformed;
  }, [data]);

  // Determine node types: entry (no incoming), exit (no outgoing), pass-through (both)
  const nodeTypes = useMemo(() => {
    if (!chartData) {
      return new Map();
    }

    const types = new Map<string, "entry" | "exit" | "passThrough">();
    const incomingLinks = new Map<string, number>();
    const outgoingLinks = new Map<string, number>();

    chartData.links.forEach((link) => {
      incomingLinks.set(link.target, (incomingLinks.get(link.target) || 0) + 1);
      outgoingLinks.set(link.source, (outgoingLinks.get(link.source) || 0) + 1);
    });

    chartData.nodes.forEach((node) => {
      const incoming = incomingLinks.get(node.id) || 0;
      const outgoing = outgoingLinks.get(node.id) || 0;

      if (incoming === 0 && outgoing > 0) {
        types.set(node.id, "entry");
      } else if (outgoing === 0 && incoming > 0) {
        types.set(node.id, "exit");
      } else {
        types.set(node.id, "passThrough");
      }
    });

    return types;
  }, [chartData]);

  // Custom color function for nodes
  const getNodeColor = (node: { id: string }) => {
    const nodeType = nodeTypes.get(node.id);
    switch (nodeType) {
      case "entry":
        return colors.entry;
      case "exit":
        return colors.exit;
      case "passThrough":
        return colors.passThrough;
      default:
        return colors.passThrough; // Default fallback
    }
  };

  if (!chartData) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className={className || "h-[400px] w-full"}>
      <ResponsiveSankey
        animate={true}
        colors={getNodeColor}
        data={chartData}
        // nodeHoverOthersOpacity={0.35}
        enableLinkGradient={true}
        labelOrientation="vertical"
        labelPadding={16}
        labelPosition="outside"
        labelTextColor={
          labelColor === "auto"
            ? (node: { color?: string }) => {
                // Use the node's color and darken it
                if (node.color) {
                  return darkenColor(node.color, 0.3);
                }
                // Fallback to a default darker color
                return darkenColor(colors.passThrough, 0.3);
              }
            : resolvedLabelColor || labelColor
        }
        linkBlendMode="hard-light"
        // linkHoverOthersOpacity={0.15}
        // linkHoverOpacity={1}
        linkContract={4}
        linkOpacity={0.1}
        linkTooltip={SankeyLinkTooltip}
        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
        motionConfig="gentle"
        nodeBorderColor={{
          from: "color",
          modifiers: [["darker", 0.8]],
        }}
        nodeBorderRadius={3}
        nodeBorderWidth={0}
        nodeOpacity={1}
        nodeSpacing={24}
        nodeThickness={18}
        nodeTooltip={SankeyNodeTooltip}
        theme={{
          text: {
            fontFamily: "inherit",
            fontSize: 12,
          },
        }}
      />
    </div>
  );
}

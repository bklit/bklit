"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import { useMemo } from "react";

interface SankeyNivoProps {
  data: {
    nodes: Array<{ id: string }>;
    links: Array<{ source: string; target: string; value: number }>;
  };
  className?: string;
}

export function SankeyNivo({ data, className }: SankeyNivoProps) {
  const chartData = useMemo(() => {
    if (!data.nodes.length || !data.links.length) {
      console.log("SankeyNivo: Missing nodes or links", {
        nodeCount: data.nodes.length,
        linkCount: data.links.length,
      });
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

      if (!isValid) {
        console.warn("SankeyNivo: Invalid link filtered out:", link, {
          isSelfLoop,
        });
      }
      return isValid;
    });

    if (validLinks.length === 0) {
      console.log("SankeyNivo: No valid links after filtering");
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

  if (!chartData) {
    return (
      <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className={className || "h-[400px] w-full"}>
      <ResponsiveSankey
        data={chartData}
        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
        nodeOpacity={1}
        // nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderColor={{
          from: "color",
          modifiers: [["darker", 0.8]],
        }}
        nodeBorderRadius={3}
        linkOpacity={0.1}
        // linkHoverOthersOpacity={0.15}
        // linkHoverOpacity={1}
        linkContract={4}
        enableLinkGradient={true}
        linkBlendMode="hard-light"
        labelPosition="outside"
        labelOrientation="vertical"
        labelPadding={16}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 0.5]],
        }}
        colors={{ scheme: "pastel2" }}
        theme={{
          text: {
            fontFamily: "inherit",
            fontSize: 12,
          },
        }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

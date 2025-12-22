import {
  type FunnelPart,
  type PartTooltipProps,
  ResponsiveFunnel,
} from "@nivo/funnel";

interface FunnelProps {
  data: {
    id: string;
    value: number;
    label: string;
  }[];
}

function FunnelTooltip(props: PartTooltipProps<FunnelPart<any>>) {
  const {
    part: { id, value, formattedValue, color, label, data },
  } = props;

  const displayValue =
    formattedValue || (value !== undefined ? value.toLocaleString() : "");
  const displayLabel = label || data?.label || id || "Step";

  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{displayLabel}</div>
      <div className="flex items-center gap-2">
        {color && (
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: color }}
          />
        )}
        <div className="flex flex-1 items-center justify-between leading-none">
          <span className="text-muted-foreground">Conversions</span>
          <span className="font-medium font-mono text-foreground tabular-nums">
            {displayValue || "0"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Funnel({ data }: FunnelProps) {
  const stageColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return (
    <div className="h-[400px] w-full">
      <ResponsiveFunnel
        afterSeparatorLength={20}
        afterSeparatorOffset={10}
        beforeSeparatorLength={20}
        beforeSeparatorOffset={10}
        borderWidth={0}
        colors={stageColors}
        currentBorderWidth={40}
        currentPartSizeExtension={10}
        data={data}
        enableLabel={true}
        labelColor={{
          from: "color",
          modifiers: [["brighter", 3]],
        }}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        motionConfig="gentle"
        shapeBlending={0.66}
        theme={{
          text: {
            fill: "hsl(0, 0%, 85%)",
            fontSize: 12,
            fontWeight: 500,
          },
          grid: {
            line: {
              stroke: "var(--chart-cartesian)",
              strokeDasharray: "5 5",
              strokeWidth: 1,
            },
          },
          tooltip: {
            container: {
              background: "hsl(0, 0%, 10%)",
              color: "hsl(0, 0%, 95%)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            },
          },
        }}
        tooltip={FunnelTooltip}
        valueFormat=">-,.0f"
      />
    </div>
  );
}

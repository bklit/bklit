import {
  ResponsiveFunnel,
  type PartTooltipProps,
  type FunnelPart,
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
    <div className="border-border/50 bg-background grid min-w-32 items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{displayLabel}</div>
      <div className="flex items-center gap-2">
        {color && (
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: color }}
          />
        )}
        <div className="flex flex-1 justify-between leading-none items-center">
          <span className="text-muted-foreground">Conversions</span>
          <span className="text-foreground font-mono font-medium tabular-nums">
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
        data={data}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        shapeBlending={0.66}
        valueFormat=">-,.0f"
        colors={stageColors}
        borderWidth={0}
        labelColor={{
          from: "color",
          modifiers: [["brighter", 3]],
        }}
        beforeSeparatorLength={20}
        beforeSeparatorOffset={10}
        afterSeparatorLength={20}
        afterSeparatorOffset={10}
        currentPartSizeExtension={10}
        currentBorderWidth={40}
        enableLabel={true}
        motionConfig="gentle"
        tooltip={FunnelTooltip}
        theme={{
          text: {
            fill: "hsl(0, 0%, 85%)",
            fontSize: 12,
            fontWeight: 500,
          },
          grid: {
            line: {
              stroke: "var(--bklit-500)",
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
      />
    </div>
  );
}

import { ResponsiveFunnel } from "@nivo/funnel";

interface FunnelProps {
  data: {
    id: string;
    value: number;
    label: string;
  }[];
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
        theme={{
          text: {
            fill: "hsl(0, 0%, 85%)",
            fontSize: 12,
            fontWeight: 500,
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

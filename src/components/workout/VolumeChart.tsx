import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Activity } from "lucide-react";

interface VolumeChartProps {
  data: Array<{
    week: string;
    total: number;
    [key: string]: number | string;
  }>;
}

// Color mapping for workout types
const workoutTypeColors: { [key: string]: string } = {
  Strength: "hsl(var(--chart-1))",
  Cardio: "hsl(var(--chart-2))",
  HIIT: "hsl(var(--chart-3))",
  Circuit: "hsl(var(--chart-4))",
  Flexibility: "hsl(var(--chart-5))",
  General: "hsl(220, 70%, 50%)",
  Yoga: "hsl(280, 70%, 50%)",
  Pilates: "hsl(320, 70%, 50%)",
  CrossFit: "hsl(40, 70%, 50%)",
  Bodybuilding: "hsl(140, 70%, 50%)",
  Powerlifting: "hsl(180, 70%, 50%)",
  Calisthenics: "hsl(260, 70%, 50%)",
};

export const VolumeChart = ({ data }: VolumeChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">No volume data available</p>
          <p className="text-xs mt-2">Start logging workouts to track your volume!</p>
        </div>
      </Card>
    );
  }

  // Extract unique workout types from the data
  const workoutTypes = Array.from(
    new Set(
      data.flatMap((item) =>
        Object.keys(item).filter((key) => key !== "week" && key !== "total")
      )
    )
  );

  // Build chart config dynamically
  const chartConfig: any = {};
  workoutTypes.forEach((type) => {
    chartConfig[type] = {
      label: type,
      color: workoutTypeColors[type] || "hsl(var(--chart-1))",
    };
  });

  // Calculate total volume and average
  const totalVolume = data.reduce((sum, item) => sum + (item.total || 0), 0);
  const avgVolume = data.length > 0 ? totalVolume / data.length : 0;
  const peakWeek = data.reduce(
    (max, item) => (item.total > max.total ? item : max),
    data[0]
  );

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Training Volume
            </h3>
            <p className="text-sm text-gray-500">
              Total volume per week (sets × reps × weight)
            </p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              label={{
                value: "Volume (kg)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12 },
              }}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {workoutTypes.map((type) => (
              <Bar
                key={type}
                dataKey={type}
                stackId="volume"
                fill={`var(--color-${type})`}
                name={type}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Volume</p>
            <p className="text-lg font-semibold">
              {(totalVolume / 1000).toFixed(1)}k kg
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Avg per Week</p>
            <p className="text-lg font-semibold">
              {Math.round(avgVolume).toLocaleString()} kg
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Peak Week</p>
            <p className="text-lg font-semibold">
              {Math.round(peakWeek?.total || 0).toLocaleString()} kg
            </p>
          </div>
        </div>

        {workoutTypes.length > 1 && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 text-center">
              Training across {workoutTypes.length} different workout types
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

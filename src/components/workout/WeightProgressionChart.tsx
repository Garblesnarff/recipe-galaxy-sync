import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface WeightProgressionChartProps {
  data: Array<{
    date: string;
    maxWeight: number;
    avgWeight: number;
    sets: number;
    totalReps: number;
  }>;
  exerciseName: string;
}

export const WeightProgressionChart = ({
  data,
  exerciseName,
}: WeightProgressionChartProps) => {
  const chartConfig = {
    maxWeight: {
      label: "Max Weight",
      color: "hsl(var(--chart-1))",
    },
    avgWeight: {
      label: "Avg Weight",
      color: "hsl(var(--chart-2))",
    },
  };

  // Calculate trend
  const calculateTrend = () => {
    if (data.length < 2) return null;
    const firstWeight = data[0].maxWeight;
    const lastWeight = data[data.length - 1].maxWeight;
    const change = lastWeight - firstWeight;
    const percentChange = firstWeight > 0 ? (change / firstWeight) * 100 : 0;
    return { change, percentChange };
  };

  const trend = calculateTrend();

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p className="text-sm">No weight progression data available for {exerciseName}</p>
          <p className="text-xs mt-2">Complete more workouts to see your progress!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{exerciseName}</h3>
            <p className="text-sm text-gray-500">Weight Progression Over Time</p>
          </div>
          {trend && trend.change !== 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp
                className={`h-5 w-5 ${
                  trend.change > 0 ? "text-green-600" : "text-red-600"
                }`}
              />
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    trend.change > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend.change > 0 ? "+" : ""}
                  {trend.change.toFixed(1)} kg
                </p>
                <p className="text-xs text-gray-500">
                  {trend.percentChange > 0 ? "+" : ""}
                  {trend.percentChange.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>

        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              label={{
                value: "Weight (kg)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12 },
              }}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              wrapperStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="maxWeight"
              stroke="var(--color-maxWeight)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Max Weight"
            />
            <Line
              type="monotone"
              dataKey="avgWeight"
              stroke="var(--color-avgWeight)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="Avg Weight"
            />
          </LineChart>
        </ChartContainer>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-gray-500">Sessions</p>
            <p className="text-lg font-semibold">{data.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Peak Weight</p>
            <p className="text-lg font-semibold">
              {Math.max(...data.map((d) => d.maxWeight)).toFixed(1)} kg
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Reps</p>
            <p className="text-lg font-semibold">
              {data.reduce((sum, d) => sum + d.totalReps, 0)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

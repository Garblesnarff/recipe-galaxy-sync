import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Moon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { RecoveryScore } from "@/services/workout/recovery";

interface RecoveryTrendChartProps {
  recoveryHistory: RecoveryScore[];
  restDays?: Array<{ date: string }>;
  isLoading?: boolean;
}

export const RecoveryTrendChart = ({
  recoveryHistory,
  restDays = [],
  isLoading = false,
}: RecoveryTrendChartProps) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </Card>
    );
  }

  if (!recoveryHistory || recoveryHistory.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">Recovery Trend</h3>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">
            No recovery data available yet. Log your rest days to see trends.
          </p>
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = recoveryHistory.map((score) => {
    const isRestDay = restDays.some((rd) => rd.date === score.date);
    const formattedDate = new Date(score.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return {
      date: formattedDate,
      fullDate: score.date,
      score: score.score,
      isRestDay,
      workoutIntensity: score.factors.recent_intensity,
    };
  });

  // Calculate average score
  const avgScore =
    recoveryHistory.reduce((sum, s) => sum + s.score, 0) /
    recoveryHistory.length;

  // Calculate trend (simple linear regression slope)
  const n = recoveryHistory.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = recoveryHistory.map((s) => s.score);
  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;
  const numerator = xValues.reduce(
    (sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean),
    0
  );
  const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const trend = slope > 0.5 ? "improving" : slope < -0.5 ? "declining" : "stable";

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{data.fullDate}</p>
          <p className="text-sm text-gray-600">
            Recovery Score:{" "}
            <span className="font-semibold text-blue-600">{data.score}</span>
          </p>
          {data.workoutIntensity > 0 && (
            <p className="text-sm text-gray-600">
              Avg Intensity:{" "}
              <span className="font-semibold text-orange-600">
                {Math.round(data.workoutIntensity)} cal
              </span>
            </p>
          )}
          {data.isRestDay && (
            <div className="mt-2 flex items-center gap-1">
              <Moon className="h-3 w-3 text-purple-600" />
              <span className="text-xs text-purple-600 font-semibold">
                Rest Day
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isRestDay) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={6} fill="#9333ea" stroke="#fff" strokeWidth={2} />
          <Moon x={cx - 4} y={cy - 4} className="h-2 w-2 text-white" />
        </g>
      );
    }
    return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" />;
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">Recovery Trend</h3>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">Avg: {Math.round(avgScore)}</Badge>
          <Badge
            variant={
              trend === "improving"
                ? "default"
                : trend === "declining"
                ? "destructive"
                : "secondary"
            }
          >
            {trend === "improving" && "↗ Improving"}
            {trend === "declining" && "↘ Declining"}
            {trend === "stable" && "→ Stable"}
          </Badge>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: "Score", angle: -90, position: "insideLeft" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            iconType="line"
          />

          {/* Reference lines for score zones */}
          <ReferenceLine
            y={80}
            stroke="#22c55e"
            strokeDasharray="3 3"
            label={{ value: "Good", position: "right", fontSize: 10 }}
          />
          <ReferenceLine
            y={50}
            stroke="#eab308"
            strokeDasharray="3 3"
            label={{ value: "Fair", position: "right", fontSize: 10 }}
          />

          {/* Score zones as areas */}
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="score"
            fill="url(#colorScore)"
            stroke="none"
          />

          {/* Main recovery score line */}
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={<CustomDot />}
            name="Recovery Score"
            activeDot={{ r: 6 }}
          />

          {/* Workout intensity line */}
          <Line
            type="monotone"
            dataKey="workoutIntensity"
            stroke="#f97316"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            name="Avg Intensity (cal)"
            yAxisId="right"
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke="#f97316"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t flex items-center justify-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span>Recovery Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded" />
          <span>Workout Intensity</span>
        </div>
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-purple-600" />
          <span>Rest Day</span>
        </div>
      </div>
    </Card>
  );
};

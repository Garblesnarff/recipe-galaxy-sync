import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import {
  calculateHeartRateZones,
  calculateAverageHeartRate,
  calculateTimeInZones,
  HeartRateZone,
} from "@/lib/healthApis";

interface HeartRateZoneChartProps {
  heartRateData: number[];
  maxHeartRate?: number;
  showZoneBreakdown?: boolean;
}

export function HeartRateZoneChart({
  heartRateData,
  maxHeartRate = 180,
  showZoneBreakdown = true,
}: HeartRateZoneChartProps) {
  if (!heartRateData || heartRateData.length === 0) {
    return null;
  }

  const zones = calculateHeartRateZones(maxHeartRate);
  const avgHeartRate = calculateAverageHeartRate(heartRateData);
  const timeInZones = calculateTimeInZones(heartRateData, zones);

  // Prepare chart data
  const chartData = heartRateData.map((hr, index) => ({
    time: index,
    heartRate: hr,
  }));

  // Calculate total time for percentages
  const totalTime = Object.values(timeInZones).reduce((sum, time) => sum + time, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Heart Rate Analysis
          </CardTitle>
          <Badge variant="outline">
            Avg: {avgHeartRate} bpm
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Heart Rate Chart */}
        <div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                label={{ value: 'Time (minutes)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: 'Heart Rate (bpm)', angle: -90, position: 'insideLeft' }}
                domain={[40, maxHeartRate + 10]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const hr = payload[0].value as number;
                    const zone = zones.find(z => hr >= z.min && hr <= z.max);
                    return (
                      <div className="bg-white border rounded-lg p-2 shadow-lg">
                        <div className="font-medium">{hr} bpm</div>
                        {zone && (
                          <div className="text-xs text-gray-600">
                            {zone.name} Zone
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Zone reference lines */}
              {zones.map((zone, index) => (
                <ReferenceLine
                  key={`zone-${index}`}
                  y={zone.min}
                  stroke={zone.color}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
              ))}

              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Breakdown */}
        {showZoneBreakdown && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Time in Each Zone</h4>
            <div className="space-y-2">
              {zones.map((zone) => {
                const time = timeInZones[zone.name] || 0;
                const percentage = totalTime > 0 ? (time / totalTime) * 100 : 0;
                const minutes = Math.floor(time / 60);
                const seconds = time % 60;

                return (
                  <div key={zone.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: zone.color }}
                        />
                        <span className="font-medium">{zone.name}</span>
                        <span className="text-gray-500 text-xs">
                          ({zone.min}-{zone.max} bpm)
                        </span>
                      </div>
                      <div className="text-gray-600">
                        {minutes}:{seconds.toString().padStart(2, '0')} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: zone.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Zone Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {zones.map((zone) => (
            <div
              key={zone.name}
              className="p-3 border rounded-lg"
              style={{ borderColor: zone.color }}
            >
              <div
                className="text-xs font-medium mb-1"
                style={{ color: zone.color }}
              >
                {zone.name}
              </div>
              <div className="text-xs text-gray-600">
                {zone.min}-{zone.max} bpm
              </div>
            </div>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {Math.min(...heartRateData)}
            </div>
            <div className="text-xs text-gray-500">Min BPM</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {avgHeartRate}
            </div>
            <div className="text-xs text-gray-500">Avg BPM</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {Math.max(...heartRateData)}
            </div>
            <div className="text-xs text-gray-500">Max BPM</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

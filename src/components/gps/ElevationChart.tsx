/**
 * ElevationChart Component
 * Displays elevation profile over distance
 */

import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Mountain } from 'lucide-react';
import { metersToKilometers } from '@/utils/geomath';

interface ElevationChartProps {
  data: Array<{
    distance: number; // meters
    elevation: number; // meters
  }>;
  currentDistance?: number; // Current position in meters
  className?: string;
}

export function ElevationChart({ data, currentDistance, className = '' }: ElevationChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Mountain className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">No elevation data available</p>
        </div>
      </Card>
    );
  }

  // Convert data to chart format
  const chartData = data.map((point) => ({
    distance: metersToKilometers(point.distance).toFixed(2),
    elevation: point.elevation.toFixed(1),
  }));

  // Calculate min and max elevation for Y-axis domain
  const elevations = data.map((p) => p.elevation);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationRange = maxElevation - minElevation;

  // Add padding to Y-axis
  const yAxisMin = Math.floor(minElevation - elevationRange * 0.1);
  const yAxisMax = Math.ceil(maxElevation + elevationRange * 0.1);

  // Calculate total elevation gain
  let totalGain = 0;
  let totalLoss = 0;
  for (let i = 1; i < data.length; i++) {
    const diff = data[i].elevation - data[i - 1].elevation;
    if (diff > 0) totalGain += diff;
    else totalLoss += Math.abs(diff);
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Elevation Profile</h3>
          <div className="flex gap-4 text-sm text-gray-600">
            <span className="text-green-600">↑ {totalGain.toFixed(0)}m gain</span>
            <span className="text-red-600">↓ {totalLoss.toFixed(0)}m loss</span>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ChartContainer
              config={{
                elevation: {
                  label: 'Elevation',
                  color: 'hsl(var(--chart-1))',
                },
              }}
            >
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                    <stop offset="50%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="distance"
                  label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5 }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  dataKey="elevation"
                  label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                  domain={[yAxisMin, yAxisMax]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => `${label} km`}
                      formatter={(value) => [`${value} m`, 'Elevation']}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="elevation"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#elevationGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
          <span>Low: {minElevation.toFixed(0)}m</span>
          <span>High: {maxElevation.toFixed(0)}m</span>
          <span>Range: {elevationRange.toFixed(0)}m</span>
        </div>
      </div>
    </Card>
  );
}

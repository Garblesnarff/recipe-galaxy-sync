import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { useState } from "react";

interface MuscleGroupHeatmapProps {
  data: Array<{
    muscleGroup: string;
    count: number;
    percentage: number;
  }>;
}

export const MuscleGroupHeatmap = ({ data }: MuscleGroupHeatmapProps) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">No muscle group data available</p>
          <p className="text-xs mt-2">Complete workouts to see muscle group balance!</p>
        </div>
      </Card>
    );
  }

  // Filter out muscle groups with zero count
  const activeData = data.filter((item) => item.count > 0);

  // Calculate max count for color intensity
  const maxCount = Math.max(...activeData.map((item) => item.count), 1);

  // Get color intensity based on count
  const getColorIntensity = (count: number): string => {
    const intensity = (count / maxCount) * 100;
    if (intensity >= 80) return "bg-blue-600 text-white border-blue-700";
    if (intensity >= 60) return "bg-blue-500 text-white border-blue-600";
    if (intensity >= 40) return "bg-blue-400 text-white border-blue-500";
    if (intensity >= 20) return "bg-blue-300 text-gray-800 border-blue-400";
    if (intensity > 0) return "bg-blue-200 text-gray-700 border-blue-300";
    return "bg-gray-100 text-gray-400 border-gray-200";
  };

  // Find most and least trained muscle groups
  const sortedData = [...activeData].sort((a, b) => b.count - a.count);
  const mostTrained = sortedData[0];
  const leastTrained = sortedData[sortedData.length - 1];

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Muscle Group Balance
            </h3>
            <p className="text-sm text-gray-500">
              Training frequency by muscle group
            </p>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {activeData.map((item) => (
            <button
              key={item.muscleGroup}
              onClick={() =>
                setSelectedGroup(
                  selectedGroup === item.muscleGroup ? null : item.muscleGroup
                )
              }
              className={`
                p-4 rounded-lg border-2 transition-all hover:scale-105
                ${getColorIntensity(item.count)}
                ${
                  selectedGroup === item.muscleGroup
                    ? "ring-2 ring-blue-600 ring-offset-2"
                    : ""
                }
              `}
            >
              <div className="text-center">
                <p className="text-xs font-semibold mb-1">{item.muscleGroup}</p>
                <p className="text-lg font-bold">{item.count}</p>
                <p className="text-xs opacity-80">{item.percentage}%</p>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Group Details */}
        {selectedGroup && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900">
              {selectedGroup}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Trained{" "}
              {activeData.find((d) => d.muscleGroup === selectedGroup)?.count}{" "}
              times (
              {
                activeData.find((d) => d.muscleGroup === selectedGroup)
                  ?.percentage
              }
              % of all workouts)
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t flex-wrap">
          <span className="text-xs text-gray-500">Intensity:</span>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-blue-200 rounded border border-blue-300"></div>
            <span className="text-xs text-gray-600">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-blue-400 rounded border border-blue-500"></div>
            <span className="text-xs text-gray-600">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-blue-600 rounded border border-blue-700"></div>
            <span className="text-xs text-gray-600">High</span>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {mostTrained && (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                Most Trained
              </Badge>
              <span className="text-sm font-medium">{mostTrained.muscleGroup}</span>
              <span className="text-xs text-gray-500">({mostTrained.count}x)</span>
            </div>
          )}
          {leastTrained && (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-300">
                Least Trained
              </Badge>
              <span className="text-sm font-medium">{leastTrained.muscleGroup}</span>
              <span className="text-xs text-gray-500">({leastTrained.count}x)</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Bed,
  Activity,
  Zap,
  Dumbbell,
  Calendar,
  Flame,
  Moon,
} from "lucide-react";
import { RecoveryScore } from "@/services/workout/recovery";
import { cn } from "@/lib/utils";

interface RecoveryScoreWidgetProps {
  recoveryScore: RecoveryScore | null;
  isLoading?: boolean;
  onLogRestDay?: () => void;
}

export const RecoveryScoreWidget = ({
  recoveryScore,
  isLoading = false,
  onLogRestDay,
}: RecoveryScoreWidgetProps) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </Card>
    );
  }

  if (!recoveryScore) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-6 w-6 text-red-600" />
          <h3 className="text-xl font-bold text-gray-800">Recovery Score</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            No recovery data available. Log your rest day to calculate your recovery score.
          </p>
          {onLogRestDay && (
            <Button onClick={onLogRestDay}>
              <Moon className="mr-2 h-4 w-4" />
              Log Rest Day
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const { score, factors, recommendation } = recoveryScore;

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 border-green-600";
    if (score >= 50) return "text-yellow-600 border-yellow-600";
    return "text-red-600 border-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 50) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 50) return "secondary";
    return "destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-600" />
          <h3 className="text-xl font-bold text-gray-800">Recovery Score</h3>
        </div>
        <Badge variant={getScoreBadgeVariant(score)}>
          {getScoreLabel(score)}
        </Badge>
      </div>

      {/* Score Display */}
      <div
        className={cn(
          "mb-6 p-8 rounded-lg border-2 text-center",
          getScoreBgColor(score)
        )}
      >
        <div className={cn("text-6xl font-bold mb-2", getScoreColor(score))}>
          {score}
        </div>
        <div className="text-sm text-gray-600 uppercase tracking-wide">
          out of 100
        </div>
      </div>

      {/* Recommendation */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-900">{recommendation}</p>
      </div>

      {/* Factors Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Recovery Factors
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Bed className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-xs text-gray-600">Sleep</p>
              <p className="text-sm font-semibold text-gray-800">
                {factors.sleep}h
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Activity className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-gray-600">Soreness</p>
              <p className="text-sm font-semibold text-gray-800">
                {factors.soreness}/10
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Zap className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="text-xs text-gray-600">Energy</p>
              <p className="text-sm font-semibold text-gray-800">
                {factors.energy}/10
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Dumbbell className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Workouts/Week</p>
              <p className="text-sm font-semibold text-gray-800">
                {factors.workouts_this_week}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Days Since Rest</p>
              <p className="text-sm font-semibold text-gray-800">
                {factors.days_since_rest}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Flame className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-xs text-gray-600">Avg Intensity</p>
              <p className="text-sm font-semibold text-gray-800">
                {factors.recent_intensity} cal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {onLogRestDay && score < 50 && (
        <div className="mt-6 pt-6 border-t">
          <Button onClick={onLogRestDay} className="w-full" variant="outline">
            <Moon className="mr-2 h-4 w-4" />
            Update Rest Day Info
          </Button>
        </div>
      )}
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, Calendar, Target } from "lucide-react";

interface ConsistencyWidgetProps {
  data: {
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    totalWorkouts: number;
    activeDays: number;
    avgWorkoutsPerWeek: number;
  } | null;
}

export const ConsistencyWidget = ({ data }: ConsistencyWidgetProps) => {
  if (!data) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Flame className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">No consistency data available</p>
          <p className="text-xs mt-2">Start working out to track your consistency!</p>
        </div>
      </Card>
    );
  }

  // Get motivational message based on completion rate
  const getMotivationalMessage = (rate: number): string => {
    if (rate >= 90) return "You're crushing it! Outstanding consistency!";
    if (rate >= 75) return "Great job! You're staying on track!";
    if (rate >= 60) return "Good progress! Keep building that habit!";
    if (rate >= 40) return "You're making progress. Stay committed!";
    return "Every workout counts. Keep going!";
  };

  // Get streak badge
  const getStreakBadge = (streak: number) => {
    if (streak >= 30)
      return { label: "Legendary", color: "bg-purple-600 text-white" };
    if (streak >= 14)
      return { label: "On Fire", color: "bg-orange-600 text-white" };
    if (streak >= 7) return { label: "Week Strong", color: "bg-blue-600 text-white" };
    if (streak >= 3) return { label: "Building", color: "bg-green-600 text-white" };
    return { label: "Getting Started", color: "bg-gray-600 text-white" };
  };

  const streakBadge = getStreakBadge(data.currentStreak);

  // Get completion rate color
  const getCompletionColor = (rate: number): string => {
    if (rate >= 75) return "text-green-600";
    if (rate >= 50) return "text-blue-600";
    if (rate >= 25) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Consistency Tracker
            </h3>
            <p className="text-sm text-gray-500">Your workout commitment</p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Completion Rate</span>
            <span
              className={`text-2xl font-bold ${getCompletionColor(
                data.completionRate
              )}`}
            >
              {data.completionRate}%
            </span>
          </div>
          <Progress value={data.completionRate} className="h-3" />
          <p className="text-xs text-gray-500 text-center">
            Based on 3 workouts per week goal
          </p>
        </div>

        {/* Current Streak */}
        <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600">
                  {data.currentStreak}
                </p>
                <p className="text-xs text-gray-500">days</p>
              </div>
            </div>
            <Badge className={streakBadge.color}>{streakBadge.label}</Badge>
          </div>

          {data.currentStreak > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-orange-200">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <p className="text-xs text-orange-800 font-medium">
                Don't break the streak! Keep it going!
              </p>
            </div>
          )}
        </div>

        {/* Longest Streak */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Personal Best Streak</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.longestStreak} days
              </p>
            </div>
            {data.currentStreak === data.longestStreak &&
              data.currentStreak > 0 && (
                <Badge className="bg-yellow-500 text-white">
                  New Record!
                </Badge>
              )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-gray-600" />
            <p className="text-xs text-gray-500">Active Days</p>
            <p className="text-lg font-semibold text-gray-800">
              {data.activeDays}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-gray-600" />
            <p className="text-xs text-gray-500">Workouts</p>
            <p className="text-lg font-semibold text-gray-800">
              {data.totalWorkouts}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Target className="h-5 w-5 mx-auto mb-1 text-gray-600" />
            <p className="text-xs text-gray-500">Per Week</p>
            <p className="text-lg font-semibold text-gray-800">
              {data.avgWorkoutsPerWeek}
            </p>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="p-4 bg-gradient-to-r from-blue-100 to-green-100 rounded-md border border-blue-300">
          <p className="text-center text-sm font-semibold text-blue-900">
            {getMotivationalMessage(data.completionRate)}
          </p>
        </div>

        {/* Tips */}
        {data.completionRate < 75 && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs font-semibold text-yellow-900 mb-1">
              Consistency Tip:
            </p>
            <p className="text-xs text-yellow-800">
              Try scheduling your workouts at the same time each day to build a
              stronger habit!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

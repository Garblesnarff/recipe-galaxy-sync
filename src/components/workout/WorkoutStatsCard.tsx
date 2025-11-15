import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Flame,
  Dumbbell,
  TrendingUp,
  Calendar,
  Target,
  Award,
  Activity
} from "lucide-react";

interface WorkoutStats {
  totalWorkouts?: number;
  totalDuration?: number;
  totalCalories?: number;
  currentStreak?: number;
  longestStreak?: number;
  favoriteExercise?: string;
  avgWorkoutDuration?: number;
  workoutsThisWeek?: number;
  workoutsThisMonth?: number;
}

interface WorkoutStatsCardProps {
  stats: WorkoutStats;
  variant?: "compact" | "detailed";
}

export const WorkoutStatsCard = ({
  stats,
  variant = "detailed",
}: WorkoutStatsCardProps) => {
  if (variant === "compact") {
    return (
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Dumbbell className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.totalWorkouts || 0}
            </p>
            <p className="text-xs text-gray-600">Total Workouts</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.totalDuration || 0}
            </p>
            <p className="text-xs text-gray-600">Minutes</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Flame className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.totalCalories || 0}
            </p>
            <p className="text-xs text-gray-600">Calories</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.currentStreak || 0}
            </p>
            <p className="text-xs text-gray-600">Day Streak</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-800">Workout Statistics</h3>
          </div>
          <Badge variant="secondary">All Time</Badge>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Workouts</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalWorkouts || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-600 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Duration</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalDuration || 0} min
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Calories Burned</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalCalories || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Streaks Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-xl font-bold text-purple-700">
                  {stats.currentStreak || 0} days
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Longest Streak</p>
                <p className="text-xl font-bold text-yellow-700">
                  {stats.longestStreak || 0} days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">This Week</p>
              <p className="font-semibold text-gray-800">
                {stats.workoutsThisWeek || 0} workouts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">This Month</p>
              <p className="font-semibold text-gray-800">
                {stats.workoutsThisMonth || 0} workouts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Avg Duration</p>
              <p className="font-semibold text-gray-800">
                {stats.avgWorkoutDuration || 0} min
              </p>
            </div>
          </div>

          {stats.favoriteExercise && (
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Favorite</p>
                <p className="font-semibold text-gray-800 truncate">
                  {stats.favoriteExercise}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Motivational Message */}
        {stats.currentStreak && stats.currentStreak >= 7 && (
          <div className="p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-md border border-green-300">
            <p className="text-center text-sm font-semibold text-gray-800">
              Amazing! You're on a {stats.currentStreak}-day streak! Keep it up!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

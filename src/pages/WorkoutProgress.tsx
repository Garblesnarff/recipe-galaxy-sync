
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Award, Zap, BarChart3, Download } from "lucide-react";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { usePersonalRecords } from "@/hooks/usePersonalRecords";
import { WorkoutActivityChart } from "@/components/workout/WorkoutActivityChart";
import { ExerciseProgressChart } from "@/components/workout/ExerciseProgressChart";
import { PersonalRecordsTable } from "@/components/workout/PersonalRecordsTable";
import { WorkoutStatsCards } from "@/components/workout/WorkoutStatsCards";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkoutAnalytics, type DateRange } from "@/hooks/useWorkoutAnalytics";
import { VolumeChart } from "@/components/workout/VolumeChart";
import { MuscleGroupHeatmap } from "@/components/workout/MuscleGroupHeatmap";
import { StrengthScoreCard } from "@/components/workout/StrengthScoreCard";
import { FrequencyChart } from "@/components/workout/FrequencyChart";
import { ConsistencyWidget } from "@/components/workout/ConsistencyWidget";

const WorkoutProgress = () => {
  const navigate = useNavigate();
  const {
    stats,
    activityData,
    exerciseProgress,
    personalRecords,
    isLoading,
  } = useWorkoutProgress();

  // Fetch personal records from the new PR tracking system
  const { data: prRecords = [], isLoading: prLoading } = usePersonalRecords();

  const {
    volumeProgression,
    muscleGroupBalance,
    strengthScore,
    frequencyStats,
    consistencyScore,
    dailyFrequency,
    isLoading: analyticsLoading,
    dateRange,
    setDateRange,
  } = useWorkoutAnalytics();

  const handleExportData = () => {
    // Create CSV data from analytics
    const csvContent = "data:text/csv;charset=utf-8," +
      "Date,Total Volume,Workouts\n" +
      volumeProgression.map(row =>
        `${row.week},${row.total},${row.workouts || 0}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `workout-analytics-${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={() => navigate("/workouts")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">Progress & Statistics</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Date Range:</span>
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4weeks">Last 4 Weeks</SelectItem>
                <SelectItem value="12weeks">Last 12 Weeks</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* Stats Overview */}
        <WorkoutStatsCards stats={stats} />

        {/* Tabs for Different Views */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">
              <TrendingUp className="mr-2 h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="exercises">
              <Zap className="mr-2 h-4 w-4" />
              Exercises
            </TabsTrigger>
            <TabsTrigger value="records">
              <Award className="mr-2 h-4 w-4" />
              Records
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            {analyticsLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <>
                {/* Strength Score and Consistency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StrengthScoreCard score={strengthScore} />
                  <ConsistencyWidget data={consistencyScore} />
                </div>

                {/* Volume and Frequency */}
                <div className="grid grid-cols-1 gap-6">
                  <VolumeChart data={volumeProgression} />
                  <FrequencyChart data={dailyFrequency} />
                </div>

                {/* Muscle Group Balance */}
                <MuscleGroupHeatmap data={muscleGroupBalance} />

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <p className="text-sm text-gray-500">Avg Workouts/Week</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {frequencyStats?.avgPerWeek || 0}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <p className="text-sm text-gray-500">Total Volume</p>
                    <p className="text-2xl font-bold text-green-600">
                      {volumeProgression.length > 0
                        ? (volumeProgression.reduce((sum, d) => sum + d.total, 0) / 1000).toFixed(1) + 'k'
                        : 0} kg
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <p className="text-sm text-gray-500">Current Streak</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {consistencyScore?.currentStreak || 0} days
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <p className="text-sm text-gray-500">Muscle Groups</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {muscleGroupBalance.filter(m => m.count > 0).length}
                    </p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-6">
            {/* Activity Chart */}
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4">Workout Activity</h2>
              <WorkoutActivityChart data={activityData} />
            </div>

            {/* Weekly Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">This Week</h3>
                <p className="text-2xl font-bold">{stats?.thisWeekWorkouts || 0} workouts</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats?.thisWeekMinutes || 0} minutes
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">This Month</h3>
                <p className="text-2xl font-bold">{stats?.thisMonthWorkouts || 0} workouts</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats?.thisMonthCalories || 0} calories burned
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="exercises" className="space-y-6 mt-6">
            {/* Exercise Progress */}
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4">Exercise Progress</h2>
              <p className="text-sm text-gray-500 mb-4">
                Track your strength gains over time
              </p>
              <ExerciseProgressChart data={exerciseProgress} />
            </div>

            {/* Most Performed Exercises */}
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4">Most Performed Exercises</h2>
              <div className="space-y-3">
                {stats?.topExercises?.map((exercise, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-sm text-gray-500">{exercise.count} times</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{exercise.totalVolume} kg</p>
                      <p className="text-xs text-gray-500">total volume</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-6 mt-6">
            {/* Personal Records */}
            <PersonalRecordsTable records={prRecords} isLoading={prLoading} />

            {/* Achievements */}
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4">Recent Achievements</h2>
              <div className="space-y-3">
                {stats?.recentAchievements?.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Award className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{achievement.title}</p>
                      <p className="text-sm text-gray-500">{achievement.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{achievement.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Streaks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Current Streak</h3>
                <p className="text-3xl font-bold">{stats?.currentStreak || 0} days</p>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Longest Streak</h3>
                <p className="text-3xl font-bold">{stats?.longestStreak || 0} days</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WorkoutProgress;

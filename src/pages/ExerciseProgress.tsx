import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Award, Calendar, Dumbbell } from "lucide-react";
import { useWorkoutAnalytics } from "@/hooks/useWorkoutAnalytics";
import { fetchExerciseProgress, fetchPersonalRecords } from "@/services/workout/workoutStats";
import { WeightProgressionChart } from "@/components/workout/WeightProgressionChart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const ExerciseProgress = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exerciseName = searchParams.get("exercise") || "";
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);

  const {
    weightProgression,
    dateRange,
    setDateRange,
    isLoading: analyticsLoading,
  } = useWorkoutAnalytics(exerciseName);

  // Fetch exercise progress data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || !exerciseName) return;

      try {
        setIsLoading(true);
        const [progress, prs] = await Promise.all([
          fetchExerciseProgress(user.id, exerciseName, 50),
          fetchPersonalRecords(user.id),
        ]);

        setProgressData(progress);
        setPersonalRecords(prs);
      } catch (error) {
        console.error("Error loading exercise data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, exerciseName]);

  // Calculate all-time PRs
  const exercisePR = personalRecords.find(
    (pr) => pr.exerciseName === exerciseName
  );

  // Calculate volume progression
  const volumeProgression = progressData.map((session) => {
    const volume =
      session.repsAchieved && session.weightUsed
        ? session.repsAchieved.reduce(
            (total: number, reps: number, index: number) =>
              total + reps * (session.weightUsed[index] || 0),
            0
          )
        : 0;
    return {
      date: new Date(session.date).toLocaleDateString(),
      volume,
      maxWeight: session.maxWeight,
    };
  });

  // Calculate rep progression (max reps in a single set)
  const repProgression = progressData.map((session) => ({
    date: new Date(session.date).toLocaleDateString(),
    maxReps: Math.max(...(session.repsAchieved || [0])),
    avgReps:
      session.repsAchieved?.length > 0
        ? session.repsAchieved.reduce((a: number, b: number) => a + b, 0) /
          session.repsAchieved.length
        : 0,
  }));

  if (!exerciseName) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">No exercise selected</p>
      </div>
    );
  }

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
                onClick={() => navigate("/workouts/progress")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  {exerciseName}
                </h1>
                <p className="text-sm text-gray-500">Detailed progress tracking</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Time Period:</span>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
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

      <main className="container py-6 space-y-6">
        {/* All-Time PRs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Max Weight PR</p>
                <p className="text-3xl font-bold text-yellow-700">
                  {exercisePR?.maxWeight || 0}
                  <span className="text-lg ml-1">kg</span>
                </p>
                {exercisePR?.date && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(exercisePR.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-3xl font-bold text-blue-700">
                  {progressData.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">workouts logged</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Reps</p>
                <p className="text-3xl font-bold text-green-700">
                  {progressData.reduce((sum, s) => sum + (s.totalReps || 0), 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">all time</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Weight Progression */}
        <WeightProgressionChart data={weightProgression} exerciseName={exerciseName} />

        {/* Volume Progression */}
        {volumeProgression.length > 0 && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Volume Progression</h3>
                <p className="text-sm text-gray-500">
                  Total work output (sets × reps × weight)
                </p>
              </div>

              <div className="space-y-2">
                {volumeProgression.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.date}</p>
                      <p className="text-xs text-gray-500">
                        Max weight: {item.maxWeight} kg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {item.volume}
                      </p>
                      <p className="text-xs text-gray-500">kg volume</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total Volume</p>
                    <p className="text-xl font-bold text-blue-600">
                      {volumeProgression
                        .reduce((sum, item) => sum + item.volume, 0)
                        .toLocaleString()}{" "}
                      kg
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Avg per Session</p>
                    <p className="text-xl font-bold text-green-600">
                      {Math.round(
                        volumeProgression.reduce(
                          (sum, item) => sum + item.volume,
                          0
                        ) / volumeProgression.length
                      ).toLocaleString()}{" "}
                      kg
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Rep Progression */}
        {repProgression.length > 0 && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Rep Progression</h3>
                <p className="text-sm text-gray-500">
                  Maximum and average reps per session
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repProgression.slice(0, 10).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.date}</p>
                      <p className="text-xs text-gray-500">
                        Avg: {item.avgReps.toFixed(1)} reps
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      {item.maxReps} max
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Best Single Set</p>
                    <p className="text-xl font-bold text-purple-600">
                      {Math.max(...repProgression.map((r) => r.maxReps))} reps
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Avg Max Reps</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {(
                        repProgression.reduce(
                          (sum, item) => sum + item.maxReps,
                          0
                        ) / repProgression.length
                      ).toFixed(1)}{" "}
                      reps
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Sessions */}
        {progressData.length > 0 && (
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Sessions</h3>
              <div className="space-y-3">
                {progressData.slice(0, 5).map((session, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {new Date(session.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.setsCompleted} sets completed
                        </p>
                      </div>
                      <Badge variant="outline">
                        Max: {session.maxWeight} kg
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Avg Weight</p>
                        <p className="font-semibold">
                          {session.avgWeight.toFixed(1)} kg
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Total Reps</p>
                        <p className="font-semibold">{session.totalReps}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Sets</p>
                        <p className="font-semibold">
                          {session.setsCompleted}
                        </p>
                      </div>
                      {session.durationSeconds && (
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-semibold">
                            {Math.round(session.durationSeconds / 60)}m
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* No Data State */}
        {progressData.length === 0 && (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <Dumbbell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No data for this exercise yet</p>
              <p className="text-sm mt-2">
                Start logging workouts to see your progress!
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ExerciseProgress;

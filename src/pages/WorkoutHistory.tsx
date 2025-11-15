
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { WorkoutLog } from "@/types/workout";
import { fetchWorkoutLogs } from "@/services/workoutService";
import { WorkoutLogCard } from "@/components/workout/WorkoutLogCard";
import { WorkoutHistoryFilters } from "@/components/workout/WorkoutHistoryFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth } from "date-fns";

const WorkoutHistory = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  useEffect(() => {
    loadLogs();
  }, [dateRange]);

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await fetchWorkoutLogs(dateRange.start, dateRange.end);
    setLogs(data);
    setIsLoading(false);
  };

  const totalWorkouts = logs.length;
  const totalMinutes = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  const totalCalories = logs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => navigate("/workouts")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Workout History</h1>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-500">Total Workouts</p>
            <p className="text-3xl font-bold">{totalWorkouts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-500">Total Time</p>
            <p className="text-3xl font-bold">{totalMinutes} min</p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-500">Calories Burned</p>
            <p className="text-3xl font-bold">{totalCalories.toLocaleString()}</p>
          </div>
        </div>

        {/* Date Range Filter */}
        <WorkoutHistoryFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Workout Logs */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-medium mb-2">No Workouts Found</h2>
            <p className="text-gray-600 mb-6">
              No workout logs found for the selected date range
            </p>
            <Button onClick={() => navigate("/workouts")}>
              Browse Workouts
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map(log => (
              <WorkoutLogCard
                key={log.id}
                log={log}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkoutHistory;

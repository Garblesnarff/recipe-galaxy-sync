
import { WorkoutCard } from "@/components/workout/WorkoutCard";
import { WorkoutFilterBar } from "@/components/workout/WorkoutFilters";
import { UpcomingWorkoutsWidget } from "@/components/workout/UpcomingWorkoutsWidget";
import { RecoveryScoreWidget } from "@/components/workout/RecoveryScoreWidget";
import { RestDaySuggestion } from "@/components/workout/RestDaySuggestion";
import { CurrentProgramWidget } from "@/components/workout/CurrentProgramWidget";
import { LevelSystem } from "@/components/workout/LevelSystem";
import { StreakWidget } from "@/components/workout/StreakWidget";
import { QuickGenerateButton } from "@/components/ai/QuickGenerateButton";
import { useWorkoutFilters } from "@/hooks/useWorkoutFilters";
import { useWorkoutData } from "@/hooks/useWorkoutData";
import { useRecovery } from "@/hooks/useRecovery";
import { useGamification } from "@/hooks/useGamification";
import { Button } from "@/components/ui/button";
import { Plus, Moon, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MainNav } from "@/components/layout/MainNav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RestDayLogger } from "@/components/workout/RestDayLogger";
import { RestDayData } from "@/services/workout/recovery";
import { useState } from "react";

const Workouts = () => {
  const navigate = useNavigate();
  const [showLogDialog, setShowLogDialog] = useState(false);

  const {
    filters,
    setFilters,
    sortOption,
    setSortOption
  } = useWorkoutFilters();

  const { data: workouts, isLoading } = useWorkoutData(filters, sortOption);

  const {
    recoveryScore,
    restSuggestion,
    isLoading: isLoadingRecovery,
    isLoggingRest,
    logRestDay,
  } = useRecovery(7);

  const { stats, workoutDates } = useGamification();

  const handleLogRestDay = async (data: RestDayData) => {
    await logRestDay(data);
    setShowLogDialog(false);
  };

  const handleScheduleRest = () => {
    setShowLogDialog(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <MainNav />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">My Workouts</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/achievements")}>
              <Trophy className="mr-2 h-4 w-4" />
              Achievements
            </Button>
            <Button variant="outline" onClick={() => setShowLogDialog(true)}>
              <Moon className="mr-2 h-4 w-4" />
              Log Rest Day
            </Button>
            <QuickGenerateButton variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" />
            <Button onClick={() => navigate("/workouts/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Workout
            </Button>
          </div>
        </div>

        {/* Current Training Program Widget */}
        <CurrentProgramWidget />

        {/* Rest Day Suggestion */}
        {restSuggestion?.shouldRest && (
          <RestDaySuggestion
            shouldRest={restSuggestion.shouldRest}
            reason={restSuggestion.reason}
            severity={restSuggestion.severity}
            onScheduleRest={handleScheduleRest}
          />
        )}

        {/* Gamification Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LevelSystem totalPoints={stats?.total_points || 0} />
          <StreakWidget
            currentStreak={stats?.current_streak_days || 0}
            longestStreak={stats?.longest_streak_days || 0}
            workoutDates={workoutDates}
          />
        </div>

        {/* Recovery and Upcoming Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingWorkoutsWidget />
          <RecoveryScoreWidget
            recoveryScore={recoveryScore}
            isLoading={isLoadingRecovery}
            onLogRestDay={() => setShowLogDialog(true)}
          />
        </div>

      <WorkoutFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />

      {workouts && workouts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              id={workout.id}
              title={workout.title}
              description={workout.description}
              image={workout.image_url}
              duration={workout.duration_minutes}
              difficulty={workout.difficulty}
              workoutType={workout.workout_type}
              isFavorite={workout.is_favorite}
              targetMuscleGroups={workout.target_muscle_groups}
              caloriesEstimate={workout.calories_estimate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No workouts found</p>
          <p className="text-gray-400 mb-6">Try adjusting your filters or add your first workout!</p>
          <Button onClick={() => navigate("/workouts/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Workout
          </Button>
        </div>
      )}
      </div>

      {/* Log Rest Day Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Rest Day</DialogTitle>
            <DialogDescription>
              Record your rest day details to help track your recovery
            </DialogDescription>
          </DialogHeader>
          <RestDayLogger
            onSubmit={handleLogRestDay}
            isLoading={isLoggingRest}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Workouts;

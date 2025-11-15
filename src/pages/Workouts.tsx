
import { WorkoutCard } from "@/components/workout/WorkoutCard";
import { WorkoutFilterBar } from "@/components/workout/WorkoutFilters";
import { UpcomingWorkoutsWidget } from "@/components/workout/UpcomingWorkoutsWidget";
import { useWorkoutFilters } from "@/hooks/useWorkoutFilters";
import { useWorkoutData } from "@/hooks/useWorkoutData";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MainNav } from "@/components/layout/MainNav";

const Workouts = () => {
  const navigate = useNavigate();
  const {
    filters,
    setFilters,
    sortOption,
    setSortOption
  } = useWorkoutFilters();

  const { data: workouts, isLoading } = useWorkoutData(filters, sortOption);

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
        <Button onClick={() => navigate("/workouts/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Workout
        </Button>
      </div>

      <UpcomingWorkoutsWidget />

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
    </>
  );
};

export default Workouts;

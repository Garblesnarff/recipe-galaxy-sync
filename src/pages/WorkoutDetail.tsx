
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { WorkoutLoadingState } from "@/components/workout/WorkoutLoadingState";
import { WorkoutContent } from "@/components/workout/WorkoutContent";
import { WorkoutEditButton } from "@/components/workout/WorkoutEditButton";
import { RecipeRecommendations } from "@/components/workout/RecipeRecommendations";
import { LinkedRecipes } from "@/components/workout/LinkedRecipes";
import { LinkRecipeDialog } from "@/components/workout/LinkRecipeDialog";
import { ScheduleWorkoutDialog } from "@/components/workout/ScheduleWorkoutDialog";
import { useWorkoutDetail } from "@/hooks/useWorkoutDetail";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Edit, Trash2, Plus, Calendar } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const WorkoutDetail = () => {
  const {
    workout,
    isLoading,
    navigateToEdit,
    isFavorite,
    handleToggleFavorite,
    handleDelete,
  } = useWorkoutDetail();
  const navigate = useNavigate();
  const [linkRecipeDialogOpen, setLinkRecipeDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [nutritionKey, setNutritionKey] = useState(0);

  const handleNutritionUpdate = () => {
    // Trigger re-render of nutrition components
    setNutritionKey((prev) => prev + 1);
  };

  if (isLoading || !workout) {
    return <WorkoutLoadingState isLoading={isLoading} />;
  }

  const handleStartWorkout = () => {
    navigate(`/workouts/active/${workout.id}`);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="flex flex-wrap md:flex-nowrap gap-4">
        <div className="w-full space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-2">
              <WorkoutEditButton onClick={navigateToEdit} />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScheduleDialogOpen(true)}
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Workout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this workout? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Button onClick={handleStartWorkout} size="lg">
              <Play className="mr-2 h-4 w-4" />
              Start Workout
            </Button>
          </div>

          <WorkoutHeader
            workout={workout}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
          />

          <WorkoutContent
            workout={workout}
          />

          {/* Nutrition Section - UNIQUE DIFFERENTIATOR! */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Nutrition</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLinkRecipeDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Link Recipe
              </Button>
            </div>

            <div key={nutritionKey} className="space-y-4">
              <LinkedRecipes
                workoutId={workout.id}
                onRecipesChanged={handleNutritionUpdate}
              />

              <RecipeRecommendations
                workout={workout}
                onRecipeLinked={handleNutritionUpdate}
              />
            </div>
          </div>
        </div>
      </div>

      <LinkRecipeDialog
        open={linkRecipeDialogOpen}
        onOpenChange={setLinkRecipeDialogOpen}
        workout={workout}
        onRecipeLinked={handleNutritionUpdate}
      />

      <ScheduleWorkoutDialog
        workoutId={workout.id}
        workoutTitle={workout.title}
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
      />
    </div>
  );
};

export default WorkoutDetail;

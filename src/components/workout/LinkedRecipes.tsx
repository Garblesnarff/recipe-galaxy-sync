import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { getWorkoutRecipes, unlinkRecipeFromWorkout } from "@/services/nutrition/workoutNutrition";
import type { WorkoutRecipe, MealTiming } from "@/types/workout";
import { Clock, Users, Trash2, ExternalLink, Apple } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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

interface LinkedRecipesProps {
  workoutId: string;
  onRecipesChanged?: () => void;
}

export const LinkedRecipes = ({ workoutId, onRecipesChanged }: LinkedRecipesProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [linkedRecipes, setLinkedRecipes] = useState<WorkoutRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadLinkedRecipes();
  }, [workoutId]);

  const loadLinkedRecipes = async () => {
    try {
      setLoading(true);
      const data = await getWorkoutRecipes(workoutId);
      setLinkedRecipes(data);
    } catch (error) {
      console.error("Error loading linked recipes:", error);
      toast({
        title: "Error",
        description: "Failed to load linked recipes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (workoutRecipeId: string) => {
    try {
      setDeletingId(workoutRecipeId);
      await unlinkRecipeFromWorkout(workoutRecipeId);
      toast({
        title: "Recipe unlinked",
        description: "Recipe has been removed from this workout",
      });
      await loadLinkedRecipes();
      onRecipesChanged?.();
    } catch (error) {
      console.error("Error unlinking recipe:", error);
      toast({
        title: "Error",
        description: "Failed to unlink recipe",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getMealTimingBadge = (timing: MealTiming) => {
    const badges = {
      pre_workout: { label: "Pre-Workout", color: "bg-blue-500", icon: "🏃" },
      post_workout: { label: "Post-Workout", color: "bg-green-500", icon: "💪" },
      recovery: { label: "Recovery", color: "bg-purple-500", icon: "🧘" },
    };
    return badges[timing];
  };

  const getDefaultImage = () => {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";
  };

  const groupedRecipes = linkedRecipes.reduce((acc, workoutRecipe) => {
    const timing = workoutRecipe.meal_timing;
    if (!acc[timing]) {
      acc[timing] = [];
    }
    acc[timing].push(workoutRecipe);
    return acc;
  }, {} as Record<MealTiming, WorkoutRecipe[]>);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Apple className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">Linked Recipes</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (linkedRecipes.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Apple className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">Linked Recipes</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No recipes linked yet.</p>
          <p className="text-sm mt-2">Add recipes to fuel your workout!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Apple className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold">Linked Recipes</h3>
        <Badge variant="outline" className="ml-auto">
          {linkedRecipes.length} {linkedRecipes.length === 1 ? "recipe" : "recipes"}
        </Badge>
      </div>

      <div className="space-y-6">
        {(['pre_workout', 'post_workout', 'recovery'] as MealTiming[]).map((timing) => {
          const recipes = groupedRecipes[timing];
          if (!recipes || recipes.length === 0) return null;

          const badge = getMealTimingBadge(timing);

          return (
            <div key={timing} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{badge.icon}</span>
                <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>
                <span className="text-sm text-gray-500">
                  ({recipes.length})
                </span>
              </div>

              <div className="space-y-2 pl-6">
                {recipes.map((workoutRecipe) => {
                  const recipe = workoutRecipe.recipe;
                  if (!recipe) return null;

                  return (
                    <div
                      key={workoutRecipe.id}
                      className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={recipe.image_url || getDefaultImage()}
                        alt={recipe.title}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/recipe/${recipe.id}`)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getDefaultImage();
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className="font-semibold text-sm leading-tight line-clamp-1 cursor-pointer hover:text-blue-600"
                            onClick={() => navigate(`/recipe/${recipe.id}`)}
                          >
                            {recipe.title}
                          </h4>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                disabled={deletingId === workoutRecipe.id}
                              >
                                <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Unlink Recipe</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this recipe from the workout?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleUnlink(workoutRecipe.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Unlink
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        {recipe.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                            {recipe.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2">
                          {recipe.cook_time && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {recipe.cook_time}
                            </div>
                          )}
                          {recipe.servings && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Users className="h-3 w-3 mr-1" />
                              {recipe.servings} servings
                            </div>
                          )}
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => navigate(`/recipe/${recipe.id}`)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Recipe
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

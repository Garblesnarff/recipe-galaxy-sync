import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { suggestRecipesForWorkout, linkRecipeToWorkout } from "@/services/nutrition/workoutNutrition";
import type { RecipeSuggestion, Workout, MealTiming } from "@/types/workout";
import { Sparkles, Zap, Clock, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecipeRecommendationsProps {
  workout: Workout;
  onRecipeLinked?: () => void;
}

export const RecipeRecommendations = ({ workout, onRecipeLinked }: RecipeRecommendationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingRecipeId, setLinkingRecipeId] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [workout.id]);

  const loadSuggestions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await suggestRecipesForWorkout(workout, user.id);
      setSuggestions(data);
    } catch (error) {
      console.error("Error loading recipe suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to load recipe suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkRecipe = async (recipeId: string, mealTiming: MealTiming) => {
    try {
      setLinkingRecipeId(recipeId);
      await linkRecipeToWorkout(workout.id, recipeId, mealTiming);
      toast({
        title: "Recipe linked!",
        description: "Recipe has been added to your workout nutrition plan",
      });
      onRecipeLinked?.();
    } catch (error) {
      console.error("Error linking recipe:", error);
      toast({
        title: "Error",
        description: "Failed to link recipe to workout",
        variant: "destructive",
      });
    } finally {
      setLinkingRecipeId(null);
    }
  };

  const getMealTimingBadge = (timing: MealTiming) => {
    const badges = {
      pre_workout: { label: "Pre-Workout", color: "bg-blue-500" },
      post_workout: { label: "Post-Workout", color: "bg-green-500" },
      recovery: { label: "Recovery", color: "bg-purple-500" },
    };
    return badges[timing];
  };

  const getDefaultImage = () => {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Suggested Recipes</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Suggested Recipes</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No recipe suggestions yet.</p>
          <p className="text-sm mt-2">Add some recipes to get personalized recommendations!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Suggested Recipes</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          <Zap className="h-3 w-3 mr-1" />
          {workout.calories_estimate || 300} cal workout
        </Badge>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        These recipes match your workout's calorie burn and nutritional needs
      </p>

      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const recipe = suggestion.recipe;
          const timingBadge = getMealTimingBadge(suggestion.recommended_timing);

          return (
            <div
              key={recipe.id}
              className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <img
                src={recipe.image_url || getDefaultImage()}
                alt={recipe.title}
                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getDefaultImage();
                }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight line-clamp-1">
                    {recipe.title}
                  </h4>
                  <Badge className={`${timingBadge.color} text-white text-xs flex-shrink-0`}>
                    {timingBadge.label}
                  </Badge>
                </div>

                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                  {suggestion.reason}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  {recipe.cook_time && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {recipe.cook_time}
                    </div>
                  )}
                  <div className="flex items-center text-xs text-gray-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {suggestion.match_score}% match
                  </div>
                </div>

                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => handleLinkRecipe(recipe.id, suggestion.recommended_timing)}
                    disabled={linkingRecipeId === recipe.id}
                  >
                    {linkingRecipeId === recipe.id ? "Adding..." : "Add to Workout"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {suggestions.length >= 6 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Showing top {suggestions.length} recommendations
          </p>
        </div>
      )}
    </Card>
  );
};

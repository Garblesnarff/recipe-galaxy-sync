import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { linkRecipeToWorkout } from "@/services/nutrition/workoutNutrition";
import type { Recipe } from "@/types/recipe";
import type { MealTiming, Workout } from "@/types/workout";
import { MEAL_TIMING_OPTIONS } from "@/types/workout";
import { Search, Clock, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LinkRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: Workout;
  onRecipeLinked?: () => void;
}

export const LinkRecipeDialog = ({
  open,
  onOpenChange,
  workout,
  onRecipeLinked,
}: LinkRecipeDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedTiming, setSelectedTiming] = useState<MealTiming>("post_workout");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadRecipes();
    }
  }, [open, user]);

  const loadRecipes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error("Error loading recipes:", error);
      toast({
        title: "Error",
        description: "Failed to load recipes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      recipe.title.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query)
    );
  });

  const handleLinkRecipe = async () => {
    if (!selectedRecipe) return;

    try {
      setLinking(true);
      await linkRecipeToWorkout(workout.id, selectedRecipe.id, selectedTiming);
      toast({
        title: "Recipe linked!",
        description: `${selectedRecipe.title} has been added to your workout`,
      });
      onRecipeLinked?.();
      onOpenChange(false);
      setSelectedRecipe(null);
      setSearchQuery("");
    } catch (error) {
      console.error("Error linking recipe:", error);
      toast({
        title: "Error",
        description: "Failed to link recipe to workout",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  const getDefaultImage = () => {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Recipe to Workout</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Meal Timing Selection */}
          {selectedRecipe && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-semibold mb-3 block">
                When will you eat this?
              </Label>
              <RadioGroup
                value={selectedTiming}
                onValueChange={(value) => setSelectedTiming(value as MealTiming)}
                className="grid grid-cols-3 gap-3"
              >
                {MEAL_TIMING_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedTiming === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Recipe List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "No recipes found" : "No recipes yet. Create some recipes first!"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecipes.map((recipe) => {
                  const isSelected = selectedRecipe?.id === recipe.id;

                  return (
                    <div
                      key={recipe.id}
                      className={`flex gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      <img
                        src={recipe.image_url || getDefaultImage()}
                        alt={recipe.title}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getDefaultImage();
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-tight line-clamp-1">
                          {recipe.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                          {recipe.description}
                        </p>

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
                          {recipe.difficulty && (
                            <Badge variant="outline" className="text-xs">
                              {recipe.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedRecipe(null);
                setSearchQuery("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkRecipe}
              disabled={!selectedRecipe || linking}
            >
              {linking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link Recipe"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

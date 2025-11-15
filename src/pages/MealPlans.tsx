import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { MealPlan, MealPlanRecipe, MealType } from "@/types/workout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, Trash2, ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";

export const MealPlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  useEffect(() => {
    loadMealPlans();
  }, []);

  const loadMealPlans = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("meal_plans")
        .select(`
          *,
          recipes:meal_plan_recipes(
            *,
            recipe:recipes(*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMealPlans(data || []);

      if (data && data.length > 0 && !selectedPlan) {
        setSelectedPlan(data[0]);
      }
    } catch (error) {
      console.error("Error loading meal plans:", error);
      toast({
        title: "Error",
        description: "Failed to load meal plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMealPlan = async () => {
    if (!user || !newPlanName.trim()) return;

    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .insert({
          user_id: user.id,
          name: newPlanName,
          description: newPlanDescription,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Meal plan created!",
        description: `${newPlanName} has been created`,
      });

      setNewPlanName("");
      setNewPlanDescription("");
      setCreateDialogOpen(false);
      await loadMealPlans();
      setSelectedPlan(data);
    } catch (error) {
      console.error("Error creating meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to create meal plan",
        variant: "destructive",
      });
    }
  };

  const deleteMealPlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      toast({
        title: "Meal plan deleted",
        description: "Meal plan has been removed",
      });

      await loadMealPlans();
      setSelectedPlan(null);
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete meal plan",
        variant: "destructive",
      });
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[dayNumber - 1] || "Day";
  };

  const getMealTypeLabel = (mealType: MealType) => {
    const labels = {
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      snack: "Snack",
    };
    return labels[mealType] || mealType;
  };

  const getMealTypeIcon = (mealType: MealType) => {
    const icons = {
      breakfast: "☕",
      lunch: "🍱",
      dinner: "🍽️",
      snack: "🍎",
    };
    return icons[mealType] || "🍴";
  };

  const getRecipesForDay = (dayNumber: number) => {
    if (!selectedPlan?.recipes) return [];
    return selectedPlan.recipes.filter((r) => r.day_number === dayNumber);
  };

  const groupRecipesByMealType = (recipes: MealPlanRecipe[]) => {
    return recipes.reduce((acc, recipe) => {
      const type = recipe.meal_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(recipe);
      return acc;
    }, {} as Record<MealType, MealPlanRecipe[]>);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meal plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Meal Plans</h1>
          <p className="text-gray-600 mt-1">
            Plan your meals and sync them with your workouts
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Meal Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g., My Workout Meal Plan"
                />
              </div>
              <div>
                <Label htmlFor="plan-description">Description (Optional)</Label>
                <Textarea
                  id="plan-description"
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  placeholder="Describe your meal plan..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createMealPlan}
                  disabled={!newPlanName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {mealPlans.length === 0 ? (
        <Card className="p-12 text-center">
          <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No meal plans yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first meal plan to organize your nutrition around your workouts
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Plan
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Meal Plan Selector */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm text-gray-600 mb-2 block">
                  Select Meal Plan
                </Label>
                <Select
                  value={selectedPlan?.id}
                  onValueChange={(value) => {
                    const plan = mealPlans.find((p) => p.id === value);
                    setSelectedPlan(plan || null);
                  }}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a meal plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlan && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this meal plan?")) {
                      deleteMealPlan(selectedPlan.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {selectedPlan?.description && (
              <p className="text-sm text-gray-600 mt-3">
                {selectedPlan.description}
              </p>
            )}
          </Card>

          {/* Weekly View */}
          {selectedPlan && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold">Weekly Meal Plan</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 px-3">
                    Week {currentWeekOffset + 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((dayNumber) => {
                  const dayRecipes = getRecipesForDay(dayNumber);
                  const groupedRecipes = groupRecipesByMealType(dayRecipes);

                  return (
                    <Card key={dayNumber} className="p-4 border-l-4 border-l-blue-500">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{getDayName(dayNumber)}</h3>
                          <p className="text-xs text-gray-500">
                            {dayRecipes.length} {dayRecipes.length === 1 ? "meal" : "meals"}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Meal
                        </Button>
                      </div>

                      {dayRecipes.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          No meals planned for this day
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(
                            (mealType) => {
                              const meals = groupedRecipes[mealType];
                              if (!meals || meals.length === 0) return null;

                              return (
                                <div key={mealType} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{getMealTypeIcon(mealType)}</span>
                                    <span className="text-sm font-medium text-gray-700">
                                      {getMealTypeLabel(mealType)}
                                    </span>
                                  </div>
                                  <div className="pl-6 space-y-1">
                                    {meals.map((mealPlanRecipe) => {
                                      const recipe = mealPlanRecipe.recipe;
                                      if (!recipe) return null;

                                      return (
                                        <div
                                          key={mealPlanRecipe.id}
                                          className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                          <span className="text-sm">{recipe.title}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {recipe.servings} servings
                                          </Badge>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default MealPlans;

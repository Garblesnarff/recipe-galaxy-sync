/**
 * Weekly Meal Plan
 * Component displaying the weekly meal planning grid
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Clock, Users, ChefHat, Trash2, Edit } from "lucide-react";
import { MealPlan, MealType, DayOfWeek, WeeklyMealPlan as WeeklyMealPlanType } from "@/types/mealPlanning";
import { AddRecipeToMealPlanDialog } from "./AddRecipeToMealPlanDialog";
import { MealPlanRecipeCard } from "./MealPlanRecipeCard";

interface WeeklyMealPlanProps {
  mealPlan: WeeklyMealPlanType;
  onRefresh: () => void;
}

const DAYS_OF_WEEK: { value: DayOfWeek; label: string; shortLabel: string }[] = [
  { value: 0, label: 'Sunday', shortLabel: 'Sun' },
  { value: 1, label: 'Monday', shortLabel: 'Mon' },
  { value: 2, label: 'Tuesday', shortLabel: 'Tue' },
  { value: 3, label: 'Wednesday', shortLabel: 'Wed' },
  { value: 4, label: 'Thursday', shortLabel: 'Thu' },
  { value: 5, label: 'Friday', shortLabel: 'Fri' },
  { value: 6, label: 'Saturday', shortLabel: 'Sat' },
];

const MEAL_TYPES: { value: MealType; label: string; color: string }[] = [
  { value: 'breakfast', label: 'Breakfast', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'lunch', label: 'Lunch', color: 'bg-green-100 text-green-800' },
  { value: 'dinner', label: 'Dinner', color: 'bg-blue-100 text-blue-800' },
  { value: 'snack', label: 'Snack', color: 'bg-purple-100 text-purple-800' },
];

export const WeeklyMealPlan = ({ mealPlan, onRefresh }: WeeklyMealPlanProps) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);

  // Group recipes by day and meal type
  const getRecipesForDayAndMeal = (day: DayOfWeek, mealType: MealType) => {
    if (!mealPlan.recipes) return [];
    return mealPlan.recipes.filter(
      (recipe) => recipe.day_of_week === day && recipe.meal_type === mealType
    );
  };

  const handleAddRecipe = (day: DayOfWeek, mealType: MealType) => {
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setIsAddRecipeOpen(true);
  };

  const handleRecipeAdded = () => {
    setIsAddRecipeOpen(false);
    setSelectedDay(null);
    setSelectedMealType(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Week Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              {mealPlan.name}
            </span>
            <Badge variant="outline">
              Week of {new Date(mealPlan.week_start_date).toLocaleDateString()}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Weekly Grid */}
      <div className="grid gap-4 md:grid-cols-7">
        {DAYS_OF_WEEK.map((day) => (
          <Card key={day.value} className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-center">
                {day.shortLabel}
                <br />
                <span className="text-sm font-normal text-gray-500">
                  {new Date(mealPlan.week_start_date).getDate() + day.value}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MEAL_TYPES.map((mealType) => {
                const dayRecipes = getRecipesForDayAndMeal(day.value, mealType.value);

                return (
                  <div key={mealType.value} className="space-y-2">
                    {/* Meal Type Header */}
                    <div className="flex items-center justify-between">
                      <Badge className={mealType.color} variant="secondary">
                        {mealType.label}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleAddRecipe(day.value, mealType.value)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>

                    {/* Recipes for this meal */}
                    <div className="space-y-2 min-h-[60px]">
                      {dayRecipes.map((mealPlanRecipe) => (
                        <MealPlanRecipeCard
                          key={mealPlanRecipe.id}
                          mealPlanRecipe={mealPlanRecipe}
                          onUpdate={onRefresh}
                        />
                      ))}

                      {dayRecipes.length === 0 && (
                        <div className="text-center py-2 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded">
                          No recipe
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 justify-center">
            {MEAL_TYPES.map((mealType) => (
              <div key={mealType.value} className="flex items-center gap-2">
                <Badge className={mealType.color} variant="secondary">
                  {mealType.label}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Recipe Dialog */}
      <AddRecipeToMealPlanDialog
        isOpen={isAddRecipeOpen}
        onClose={() => setIsAddRecipeOpen(false)}
        mealPlanId={mealPlan.id}
        initialDay={selectedDay}
        initialMealType={selectedMealType}
        onRecipeAdded={handleRecipeAdded}
      />
    </div>
  );
};

/**
 * Meal Plan Calendar
 * Calendar view component for meal planning
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, Users, Plus } from "lucide-react";
import { WeeklyMealPlan as WeeklyMealPlanType, MealType } from "@/types/mealPlanning";

interface MealPlanCalendarProps {
  mealPlan: WeeklyMealPlanType;
  onRefresh: () => void;
}

const MEAL_TYPES: { value: MealType; label: string; color: string }[] = [
  { value: 'breakfast', label: 'Breakfast', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'lunch', label: 'Lunch', color: 'bg-green-100 text-green-800' },
  { value: 'dinner', label: 'Dinner', color: 'bg-blue-100 text-blue-800' },
  { value: 'snack', label: 'Snack', color: 'bg-purple-100 text-purple-800' },
];

export const MealPlanCalendar = ({ mealPlan, onRefresh }: MealPlanCalendarProps) => {
  // Group recipes by date for calendar view
  const getRecipesByDate = () => {
    const startDate = new Date(mealPlan.week_start_date);
    const recipesByDate: { [key: string]: any[] } = {};

    // Initialize the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      recipesByDate[dateKey] = [];
    }

    // Group recipes by date
    mealPlan.recipes?.forEach(recipe => {
      const recipeDate = new Date(startDate);
      recipeDate.setDate(startDate.getDate() + recipe.day_of_week);
      const dateKey = recipeDate.toISOString().split('T')[0];
      if (recipesByDate[dateKey]) {
        recipesByDate[dateKey].push(recipe);
      }
    });

    return recipesByDate;
  };

  const recipesByDate = getRecipesByDate();
  const startDate = new Date(mealPlan.week_start_date);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar View - {mealPlan.name}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-7">
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const dateKey = date.toISOString().split('T')[0];
          const dayRecipes = recipesByDate[dateKey] || [];

          return (
            <Card key={i} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-center">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  <br />
                  <span className="text-sm font-normal text-gray-500">
                    {date.getDate()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayRecipes.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-400">
                    No meals planned
                  </div>
                ) : (
                  dayRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={MEAL_TYPES.find(m => m.value === recipe.meal_type)?.color} variant="secondary">
                          {MEAL_TYPES.find(m => m.value === recipe.meal_type)?.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="h-3 w-3" />
                          {recipe.servings}
                        </div>
                      </div>

                      <h4 className="font-medium text-sm text-gray-900 mb-1">
                        {recipe.recipe?.title || 'Recipe not found'}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {recipe.recipe?.prep_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Prep: {recipe.recipe.prep_time}</span>
                          </div>
                        )}
                        {recipe.recipe?.cook_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Cook: {recipe.recipe.cook_time}</span>
                          </div>
                        )}
                      </div>

                      {recipe.notes && (
                        <p className="text-xs text-blue-600 mt-1">
                          {recipe.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Week Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {mealPlan.recipes?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Meals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(mealPlan.recipes?.map(r => r.recipe_id)).size || 0}
              </div>
              <div className="text-sm text-gray-600">Unique Recipes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {mealPlan.recipes?.reduce((sum, r) => sum + r.servings, 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Total Servings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.min(7, Math.ceil((mealPlan.recipes?.length || 0) / 3))}
              </div>
              <div className="text-sm text-gray-600">Days Covered</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Add Recipe to Meal Plan Dialog
 * Dialog component for adding recipes to specific meal plan slots
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { useMealPlanning } from "@/hooks/useMealPlanning";
import { MealType, DayOfWeek } from "@/types/mealPlanning";
import { useRecipeData } from "@/hooks/useRecipeData";

interface AddRecipeToMealPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mealPlanId: string;
  initialDay?: DayOfWeek | null;
  initialMealType?: MealType | null;
  onRecipeAdded: () => void;
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const AddRecipeToMealPlanDialog = ({
  isOpen,
  onClose,
  mealPlanId,
  initialDay,
  initialMealType,
  onRecipeAdded,
}: AddRecipeToMealPlanDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(initialDay || 1);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(initialMealType || 'dinner');
  const [servings, setServings] = useState('2');
  const [notes, setNotes] = useState('');

  const { addRecipeToCurrentPlan, isAddingRecipe } = useMealPlanning();
  const { data: recipes, isLoading: isLoadingRecipes } = useRecipeData({
    categories: [],
    cuisine_type: null,
    diet_tags: [],
    cooking_method: null,
    season_occasion: [],
    difficulty: null,
    favorite_only: false,
    searchQuery: ''
  }, { label: 'Title', value: 'title', direction: 'asc' });

  // Filter recipes based on search query
  const filteredRecipes = recipes?.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedRecipe('');
      setSelectedDay(initialDay || 1);
      setSelectedMealType(initialMealType || 'dinner');
      setServings('2');
      setNotes('');
    }
  }, [isOpen, initialDay, initialMealType]);

  const handleAddRecipe = async () => {
    if (!selectedRecipe) {
      toast.error('Please select a recipe');
      return;
    }

    try {
      await addRecipeToCurrentPlan({
        recipe_id: selectedRecipe,
        day_of_week: selectedDay,
        meal_type: selectedMealType,
        servings: parseInt(servings),
        notes: notes.trim() || undefined,
      });

      onRecipeAdded();
    } catch (error) {
      console.error('Error adding recipe to meal plan:', error);
      toast.error('Failed to add recipe to meal plan');
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedRecipe('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Recipe to Meal Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meal Slot Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="day-select">Day of Week</Label>
              <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value) as DayOfWeek)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="meal-type-select">Meal Type</Label>
              <Select value={selectedMealType} onValueChange={(value) => setSelectedMealType(value as MealType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((meal) => (
                    <SelectItem key={meal.value} value={meal.value}>
                      {meal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recipe Search */}
          <div>
            <Label htmlFor="recipe-search">Search Recipes</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="recipe-search"
                placeholder="Search your recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Recipe Selection */}
          <div>
            <Label>Select Recipe</Label>
            <div className="max-h-48 overflow-y-auto border rounded-md">
              {isLoadingRecipes ? (
                <div className="p-4 text-center text-gray-500">Loading recipes...</div>
              ) : filteredRecipes.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? 'No recipes found matching your search' : 'No recipes available'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                        selectedRecipe === recipe.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedRecipe(recipe.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{recipe.title}</h4>
                          {recipe.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {recipe.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {recipe.cook_time && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {recipe.cook_time}
                            </div>
                          )}
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedRecipe === recipe.id ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}>
                            {selectedRecipe === recipe.id && (
                              <div className="w-full h-full rounded-full bg-white scale-50" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recipe Details */}
          {selectedRecipe && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="servings-input">Servings</Label>
                <Input
                  id="servings-input"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes-input">Notes (Optional)</Label>
                <Input
                  id="notes-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Use spicy version, double the sauce..."
                />
              </div>
            </div>
          )}

          {/* Selected Recipe Summary */}
          {selectedRecipe && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{servings} servings</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{MEAL_TYPES.find(m => m.value === selectedMealType)?.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAddRecipe}
              disabled={!selectedRecipe || isAddingRecipe}
              className="flex-1"
            >
              {isAddingRecipe ? 'Adding...' : 'Add to Meal Plan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

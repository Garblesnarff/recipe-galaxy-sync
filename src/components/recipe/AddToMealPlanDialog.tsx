/**
 * Add to Meal Plan Dialog
 * Dialog component for adding recipes to meal plans
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Utensils, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import {
  createMealPlan,
  getMealPlans,
  addRecipeToMealPlan,
  getMealPlanWithRecipes
} from "@/services/mealPlanningService";
import { MealPlan, MealType, DayOfWeek } from "@/types/mealPlanning";

interface AddToMealPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
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

export const AddToMealPlanDialog = ({
  isOpen,
  onClose,
  recipeId,
  recipeTitle,
}: AddToMealPlanDialogProps) => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedMealPlan, setSelectedMealPlan] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(1); // Default to Monday
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner');
  const [servings, setServings] = useState('2');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDate, setNewPlanDate] = useState(() => {
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + (1 - nextMonday.getDay() + 7) % 7);
    return nextMonday.toISOString().split('T')[0];
  });

  // Load existing meal plans
  useEffect(() => {
    if (isOpen) {
      loadMealPlans();
    }
  }, [isOpen]);

  const loadMealPlans = async () => {
    try {
      // For now, we'll simulate user ID - in real app get from auth
      const userId = 'current-user-id';
      const plans = await getMealPlans(userId);
      setMealPlans(plans as MealPlan[]);
    } catch (error) {
      console.error('Error loading meal plans:', error);
      toast.error('Failed to load meal plans');
    }
  };

  const handleAddToExistingPlan = async () => {
    if (!selectedMealPlan) {
      toast.error('Please select a meal plan');
      return;
    }

    setIsLoading(true);

    try {
      // For now, we'll simulate user ID - in real app get from auth
      const userId = 'current-user-id';

      await addRecipeToMealPlan(selectedMealPlan, userId, {
        recipe_id: recipeId,
        day_of_week: selectedDay,
        meal_type: selectedMealType,
        servings: parseInt(servings),
        notes: notes.trim() || undefined,
      });

      toast.success(`Added "${recipeTitle}" to meal plan!`);
      onClose();
    } catch (error) {
      console.error('Error adding to meal plan:', error);
      toast.error('Failed to add recipe to meal plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewPlan = async () => {
    if (!newPlanName.trim()) {
      toast.error('Please enter a name for the new meal plan');
      return;
    }

    setIsLoading(true);

    try {
      // For now, we'll simulate user ID - in real app get from auth
      const userId = 'current-user-id';

      const newPlan = await createMealPlan(userId, {
        name: newPlanName.trim(),
        week_start_date: newPlanDate,
      });

      // Add recipe to the newly created plan
      await addRecipeToMealPlan(newPlan.id, userId, {
        recipe_id: recipeId,
        day_of_week: selectedDay,
        meal_type: selectedMealType,
        servings: parseInt(servings),
        notes: notes.trim() || undefined,
      });

      toast.success(`Created new meal plan and added "${recipeTitle}"!`);
      onClose();
    } catch (error) {
      console.error('Error creating meal plan:', error);
      toast.error('Failed to create meal plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setSelectedMealPlan('');
    setSelectedDay(1);
    setSelectedMealType('dinner');
    setServings('2');
    setNotes('');
    setIsCreatingNew(false);
    setNewPlanName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Add to Meal Plan: {recipeTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Choose Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={!isCreatingNew ? "default" : "outline"}
                  onClick={() => setIsCreatingNew(false)}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Calendar className="h-6 w-6" />
                  <span>Add to Existing Plan</span>
                </Button>
                <Button
                  variant={isCreatingNew ? "default" : "outline"}
                  onClick={() => setIsCreatingNew(true)}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Plus className="h-6 w-6" />
                  <span>Create New Plan</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add to Existing Plan */}
          {!isCreatingNew && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add to Existing Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meal-plan-select">Select Meal Plan</Label>
                  <Select value={selectedMealPlan} onValueChange={setSelectedMealPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a meal plan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mealPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center gap-2">
                            <span>{plan.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {new Date(plan.week_start_date).toLocaleDateString()}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

                <Button
                  onClick={handleAddToExistingPlan}
                  disabled={isLoading || !selectedMealPlan}
                  className="w-full"
                >
                  {isLoading ? 'Adding...' : 'Add to Meal Plan'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Create New Plan */}
          {isCreatingNew && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create New Meal Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="plan-name">Plan Name</Label>
                  <Input
                    id="plan-name"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g., Family Dinners This Week"
                  />
                </div>

                <div>
                  <Label htmlFor="week-start">Week Starting</Label>
                  <Input
                    id="week-start"
                    type="date"
                    value={newPlanDate}
                    onChange={(e) => setNewPlanDate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-day-select">Day of Week</Label>
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
                    <Label htmlFor="new-meal-type-select">Meal Type</Label>
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

                <div>
                  <Label htmlFor="new-servings-input">Servings</Label>
                  <Input
                    id="new-servings-input"
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="new-notes-input">Notes (Optional)</Label>
                  <Input
                    id="new-notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Use spicy version, double the sauce..."
                  />
                </div>

                <Button
                  onClick={handleCreateNewPlan}
                  disabled={isLoading || !newPlanName.trim()}
                  className="w-full"
                >
                  {isLoading ? 'Creating...' : 'Create Plan & Add Recipe'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{servings} servings</span>
                </div>
                <div className="flex items-center gap-1">
                  <Utensils className="h-4 w-4" />
                  <span>{MEAL_TYPES.find(m => m.value === selectedMealType)?.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

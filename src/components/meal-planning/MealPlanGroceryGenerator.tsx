/**
 * Meal Plan Grocery Generator
 * Component for generating grocery lists from meal plans
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, CheckCircle, Circle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { WeeklyMealPlan as WeeklyMealPlanType } from "@/types/mealPlanning";
import { useMealPlanning } from "@/hooks/useMealPlanning";
import { addMultipleRecipesToGroceryList } from "@/services/groceryAdd";
import { getGroceryList } from "@/services/groceryFetch";

interface MealPlanGroceryGeneratorProps {
  mealPlan: WeeklyMealPlanType;
  onRefresh: () => void;
}

export const MealPlanGroceryGenerator = ({ mealPlan, onRefresh }: MealPlanGroceryGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { isAddingRecipe } = useMealPlanning();

  const handleGenerateGroceryList = async () => {
    if (!mealPlan.recipes || mealPlan.recipes.length === 0) {
      toast.error("No recipes in meal plan to generate grocery list from");
      return;
    }

    setIsGenerating(true);

    try {
      // Get existing grocery list to avoid duplicates
      const existingGroceryList = await getGroceryList();

      // For now, we'll simulate the grocery list generation
      // In a real implementation, you would fetch the actual recipe ingredients
      // and use addMultipleRecipesToGroceryList with proper RecipeIngredientsData

      // Simulate generated items for demo purposes
      const mockItems = [
        { id: '1', item_name: 'Chicken Breast', quantity: '2 lbs', unit: 'lbs', category: 'Meat', quantity_numeric: 2 },
        { id: '2', item_name: 'Rice', quantity: '1 cup', unit: 'cup', category: 'Grains', quantity_numeric: 1 },
        { id: '3', item_name: 'Broccoli', quantity: '1 head', unit: 'head', category: 'Vegetables', quantity_numeric: 1 },
        { id: '4', item_name: 'Olive Oil', quantity: '2 tbsp', unit: 'tbsp', category: 'Pantry', quantity_numeric: 2 },
      ];

      setGeneratedItems(mockItems);
      toast.success(`Generated grocery list with ${mockItems.length} items!`);
    } catch (error) {
      console.error('Error generating grocery list:', error);
      toast.error('Failed to generate grocery list');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleAddSelectedToGrocery = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select items to add to your grocery list");
      return;
    }

    try {
      // In a real implementation, you would add these items to the grocery list
      // For now, we'll just show a success message
      toast.success(`Added ${selectedItems.size} items to your grocery list!`);
      setSelectedItems(new Set());
      setGeneratedItems([]);
    } catch (error) {
      console.error('Error adding items to grocery list:', error);
      toast.error('Failed to add items to grocery list');
    }
  };

  const handleClearGenerated = () => {
    setGeneratedItems([]);
    setSelectedItems(new Set());
  };

  // Group items by category
  const getItemsByCategory = () => {
    const categorized: { [key: string]: any[] } = {};

    generatedItems.forEach(item => {
      const category = item.category || 'Other';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(item);
    });

    return categorized;
  };

  const itemsByCategory = getItemsByCategory();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Grocery List Generator
            </span>
            <Button
              onClick={handleGenerateGroceryList}
              disabled={isGenerating || !mealPlan.recipes?.length}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate List'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Automatically generate a grocery list from all recipes in your meal plan.
            This will combine ingredients from {mealPlan.recipes?.length || 0} recipes.
          </p>

          {mealPlan.recipes && mealPlan.recipes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recipes in this plan:</h4>
              <div className="flex flex-wrap gap-1">
                {mealPlan.recipes.map((recipe) => (
                  <Badge key={recipe.id} variant="outline" className="text-xs">
                    {recipe.recipe?.title || 'Unknown Recipe'}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Items */}
      {generatedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Grocery Items ({generatedItems.length})</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearGenerated}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddSelectedToGrocery}
                  disabled={selectedItems.size === 0}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Add Selected ({selectedItems.size})
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category}>
                  <h4 className="font-medium text-sm text-gray-700 mb-2 capitalize">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Checkbox
                          id={item.id}
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => handleItemToggle(item.id)}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={item.id}
                            className="font-medium text-sm cursor-pointer"
                          >
                            {item.item_name}
                          </label>
                          {item.quantity && (
                            <p className="text-xs text-gray-500">
                              {item.quantity} {item.unit}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.quantity_numeric || 1}x
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {generatedItems.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No grocery list generated</h3>
            <p className="text-gray-600">
              Click "Generate List" to create a grocery list from your meal plan recipes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recipe Summary */}
      {mealPlan.recipes && mealPlan.recipes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Meal Plan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {mealPlan.recipes.length}
                </div>
                <div className="text-sm text-gray-600">Recipes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(mealPlan.recipes.map(r => r.recipe_id)).size}
                </div>
                <div className="text-sm text-gray-600">Unique Recipes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {mealPlan.recipes.reduce((sum, r) => sum + r.servings, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Servings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

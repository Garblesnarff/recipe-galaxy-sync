
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { addIngredientsToGroceryList } from "@/services/groceryService";
import { toast } from "sonner";
import { RecipeIngredient } from "@/types/recipeIngredient";

export interface AddToGroceryListButtonProps {
  recipeId: string;
  ingredients: RecipeIngredient[] | string[];
}

export const AddToGroceryListButton = ({ 
  recipeId, 
  ingredients 
}: AddToGroceryListButtonProps) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToGroceryList = async () => {
    if (!ingredients || ingredients.length === 0) {
      toast.error("No ingredients to add");
      return;
    }

    setIsAdding(true);
    try {
      // Convert ingredients to strings if they're RecipeIngredient objects
      const ingredientStrings = ingredients.map(ing => {
        if (typeof ing === 'string') {
          return ing.trim();
        } else if (ing && typeof ing === 'object' && 'name' in ing) {
          // Format structured ingredient with proper checks
          const { quantity, unit, name } = ing;
          if (!name) return ''; // Skip ingredients without a name
          return [quantity || '', unit || '', name || ''].filter(Boolean).join(' ').trim();
        }
        return ''; // Return empty string for invalid items
      }).filter(ing => ing.trim() !== ''); // Filter out empty strings
      
      if (ingredientStrings.length === 0) {
        toast.error("No valid ingredients to add");
        setIsAdding(false);
        return;
      }
      
      console.log("Adding ingredients to grocery list:", ingredientStrings);
      const success = await addIngredientsToGroceryList(ingredientStrings, recipeId);
      if (success) {
        toast.success("Added to grocery list");
      }
    } catch (error) {
      console.error("Failed to add to grocery list", error);
      toast.error("Failed to add to grocery list");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="flex-1" 
      onClick={handleAddToGroceryList} 
      disabled={isAdding}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {isAdding ? "Adding..." : "Add to Grocery List"}
    </Button>
  );
};

export default AddToGroceryListButton;

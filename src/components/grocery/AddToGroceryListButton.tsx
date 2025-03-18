
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { addIngredientsToGroceryList } from "@/services/groceryService";
import { toast } from "sonner";

export interface AddToGroceryListButtonProps {
  recipeId: string;
  ingredients: string[];
}

export const AddToGroceryListButton = ({ 
  recipeId, 
  ingredients 
}: AddToGroceryListButtonProps) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToGroceryList = async () => {
    if (ingredients.length === 0) {
      toast.error("No ingredients to add");
      return;
    }

    setIsAdding(true);
    try {
      // Filter out empty ingredient strings before adding
      const validIngredients = ingredients.filter(ing => ing.trim() !== '');
      
      if (validIngredients.length === 0) {
        toast.error("No valid ingredients to add");
        return;
      }
      
      await addIngredientsToGroceryList(validIngredients, recipeId);
      toast.success("Added to grocery list");
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

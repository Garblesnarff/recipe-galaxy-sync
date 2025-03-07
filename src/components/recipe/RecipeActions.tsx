
import { Button } from "@/components/ui/button";
import { AddToGroceryListButton } from "@/components/grocery/AddToGroceryListButton";

interface RecipeActionsProps {
  ingredients: string[];
  recipeId: string;
  onRateClick: () => void;
}

export const RecipeActions = ({ ingredients, recipeId, onRateClick }: RecipeActionsProps) => {
  return (
    <div className="flex gap-3 mt-6">
      <AddToGroceryListButton 
        variant="outline" 
        className="flex-1"
        ingredients={ingredients}
        recipeId={recipeId}
      />
      <Button variant="app" className="flex-1" onClick={onRateClick}>
        Rate Recipe
      </Button>
    </div>
  );
};

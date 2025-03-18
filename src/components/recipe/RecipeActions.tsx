
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RecipeTimer } from "@/components/recipe/RecipeTimer";
import { RecipeIngredient } from "@/types/recipeIngredient";
import { AddToGroceryListButton } from "@/components/grocery/AddToGroceryListButton";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { updateRecipe } from "@/services/recipeService";

interface RecipeActionsProps {
  recipe: {
    id: string;
    cook_time?: string;
    prep_time?: string;
    is_favorite?: boolean;
  };
  ingredients: RecipeIngredient[];
  hideOptions?: boolean;
}

export const RecipeActions = ({ recipe, ingredients, hideOptions = false }: RecipeActionsProps) => {
  const [isFavorite, setIsFavorite] = useState(recipe.is_favorite || false);

  const handleFavoriteToggle = async () => {
    try {
      const newFavoriteStatus = !isFavorite;
      await updateRecipe(recipe.id, { is_favorite: newFavoriteStatus });
      setIsFavorite(newFavoriteStatus);
      toast.success(newFavoriteStatus ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      toast.error("Failed to update favorite status");
    }
  };

  const cookTimeInMinutes = recipe.cook_time ? parseInt(recipe.cook_time, 10) : 0;

  // Convert ingredients to the format expected by AddToGroceryListButton
  const ingredientStrings = ingredients.map(ingredient => {
    const { quantity, unit, name } = ingredient;
    return `${quantity || ''} ${unit || ''} ${name}`.trim();
  });

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex gap-2">
        <AddToGroceryListButton 
          recipeId={recipe.id}
          ingredients={ingredientStrings}
        />
        
        {!hideOptions && (
          <>
            <Button variant="outline" className="flex-1" onClick={handleFavoriteToggle}>
              <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {isFavorite ? 'Favorited' : 'Favorite'}
            </Button>
            
            <Link to={`/edit-recipe/${recipe.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </>
        )}
      </div>

      {cookTimeInMinutes > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Start Cooking Timer
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <RecipeTimer 
              minutes={cookTimeInMinutes} 
              label={`${recipe.cook_time} Cooking Time`}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

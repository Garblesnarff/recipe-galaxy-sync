
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RecipeTimer } from "@/components/recipe/RecipeTimer";
import { RecipeIngredient } from "@/types/recipeIngredient";
import { AddToGroceryListButton } from "@/components/grocery/AddToGroceryListButton";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { updateRecipe } from "@/services/recipeService";
import { supabase } from "@/integrations/supabase/client";

interface RecipeActionsProps {
  recipe?: {
    id: string;
    cook_time?: string;
    prep_time?: string;
    is_favorite?: boolean;
  };
  ingredients?: RecipeIngredient[];
  hideOptions?: boolean;
  recipeId?: string;
}

export const RecipeActions = ({ 
  recipe, 
  ingredients = [], 
  hideOptions = false,
  recipeId
}: RecipeActionsProps) => {
  // Use recipeId if provided, otherwise get it from the recipe object
  const effectiveRecipeId = recipeId || recipe?.id;
  
  if (!effectiveRecipeId) {
    console.error("RecipeActions requires either recipe or recipeId prop");
    return null;
  }
  
  const [isFavorite, setIsFavorite] = useState(recipe?.is_favorite || false);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[] | string[]>(ingredients);
  
  // Fetch ingredients if not provided and recipeId is available
  useEffect(() => {
    const fetchRecipeIngredients = async () => {
      if (ingredients.length === 0 && effectiveRecipeId) {
        try {
          const { data, error } = await supabase
            .from('recipes')
            .select('ingredients')
            .eq('id', effectiveRecipeId)
            .single();
            
          if (error) {
            console.error("Error fetching recipe ingredients:", error);
            return;
          }
          
          if (data && data.ingredients) {
            // Safely cast the ingredients to our expected type
            const fetchedIngredients = data.ingredients as RecipeIngredient[] | string[];
            setRecipeIngredients(fetchedIngredients);
          }
        } catch (error) {
          console.error("Error fetching recipe:", error);
        }
      }
    };
    
    fetchRecipeIngredients();
  }, [effectiveRecipeId, ingredients]);

  const handleFavoriteToggle = async () => {
    try {
      const newFavoriteStatus = !isFavorite;
      await updateRecipe(effectiveRecipeId, { is_favorite: newFavoriteStatus });
      setIsFavorite(newFavoriteStatus);
      toast.success(newFavoriteStatus ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      toast.error("Failed to update favorite status");
    }
  };

  const cookTimeInMinutes = recipe?.cook_time ? parseInt(recipe.cook_time, 10) : 0;

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex gap-2">
        <AddToGroceryListButton 
          recipeId={effectiveRecipeId}
          ingredients={recipeIngredients}
        />
        
        {!hideOptions && (
          <>
            <Button variant="outline" className="flex-1" onClick={handleFavoriteToggle}>
              <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {isFavorite ? 'Favorited' : 'Favorite'}
            </Button>
            
            <Link to={`/edit-recipe/${effectiveRecipeId}`} className="flex-1">
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
              label={`${recipe?.cook_time} Cooking Time`}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

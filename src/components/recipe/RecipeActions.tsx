import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RecipeTimer } from "@/components/recipe/RecipeTimer";
import { Recipe } from "@/types/recipe";
import { RecipeIngredient } from "@/types/recipeIngredient";
import { AddToGroceryListButton } from "@/components/grocery/AddToGroceryListButton";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRecipe } from "@/services/recipeService";

interface RecipeActionsProps {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
  hideOptions?: boolean;
}

export const RecipeActions = ({
  recipe,
  ingredients,
  hideOptions = false,
}: RecipeActionsProps) => {
  const [addToPlannerOpen, setAddToPlannerOpen] = useState(false);

  const queryClient = useQueryClient();
  const { mutate: toggleFavorite, isPending: isFavoritePending } = useMutation({
    mutationFn: async (isFavorite: boolean) => {
      if (!recipe.id) return;
      return updateRecipe(recipe.id, { is_favorite: isFavorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe', recipe.id] });
    },
  });

  return (
    <div className="flex flex-col space-y-2 mt-4">
      <div className="flex space-x-2">
        <Popover open={addToPlannerOpen} onOpenChange={setAddToPlannerOpen}>
          <PopoverTrigger asChild>
            <Button className="flex-1">
              <Calendar className="mr-2 h-4 w-4" />
              Add to Meal Plan
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="grid gap-2">
              <div className="space-y-2">
                <h4 className="font-medium">Add to Meal Plan</h4>
                <p className="text-sm text-gray-500">
                  Select a day and meal to add this recipe to your meal plan.
                </p>
              </div>
              <div className="grid gap-2">
                <p>Coming soon...</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <AddToGroceryListButton 
          recipeId={recipe.id} 
          ingredients={ingredients.map(ing => ing.name)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <RecipeTimer 
          minutes={parseInt(recipe.cook_time || "0")} 
          label="Cook Time"
        />
        <RecipeTimer 
          minutes={parseInt(recipe.prep_time || "0")} 
          label="Prep Time" 
        />
      </div>

      {!hideOptions && (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => toggleFavorite(!recipe.is_favorite)}
            disabled={isFavoritePending}
          >
            {recipe.is_favorite ? (
              <>
                <Heart className="mr-2 h-4 w-4 fill-red-500 text-red-500" />
                Remove from Favorites
              </>
            ) : (
              <>
                <Heart className="mr-2 h-4 w-4" />
                Add to Favorites
              </>
            )}
          </Button>
          <Link to={`/edit-recipe/${recipe.id}`}>
            <Button variant="secondary" className="flex-1">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Recipe
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

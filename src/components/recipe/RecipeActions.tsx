
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, Pencil, ChefHat, Plus, BookOpen, Scale, Apple, Utensils, History } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RecipeTimer } from "@/components/recipe/RecipeTimer";
import { RecipeIngredient } from "@/types/recipeIngredient";
import { AddToGroceryListButton } from "@/components/grocery/AddToGroceryListButton";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { updateRecipe } from "@/services/recipe";
import { supabase } from "@/integrations/supabase/client";
import { AddToCollectionDialog } from "@/components/collections/AddToCollectionDialog";
import { useCollectionDetail } from "@/hooks/useCollectionDetail";
import { RecipeScalerDialog } from "@/components/recipe/RecipeScalerDialog";
import { NutritionDialog } from "@/components/recipe/NutritionDialog";
import { AddToMealPlanDialog } from "@/components/recipe/AddToMealPlanDialog";
import { VersionHistoryDialog } from "@/components/recipe/VersionHistoryDialog";

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
  onAdapt: () => void;
}

export const RecipeActions = ({
  recipe,
  ingredients = [],
  hideOptions = false,
  recipeId,
  onAdapt,
}: RecipeActionsProps) => {
  // Use recipeId if provided, otherwise get it from the recipe object
  const effectiveRecipeId = recipeId || recipe?.id;

  if (!effectiveRecipeId) {
    console.error("RecipeActions requires either recipe or recipeId prop");
    return null;
  }

  const [isFavorite, setIsFavorite] = useState(recipe?.is_favorite || false);
  const [recipeIngredients, setRecipeIngredients] = useState<
    RecipeIngredient[] | string[]
  >(ingredients);
  const [isAddToCollectionDialogOpen, setIsAddToCollectionDialogOpen] = useState(false);
  const [recipeCollections, setRecipeCollections] = useState<any[]>([]);

  // New feature dialog states
  const [isScaleRecipeOpen, setIsScaleRecipeOpen] = useState(false);
  const [isNutritionDialogOpen, setIsNutritionDialogOpen] = useState(false);
  const [isAddToMealPlanOpen, setIsAddToMealPlanOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  // Fetch ingredients if not provided and recipeId is available
  useEffect(() => {
    const fetchRecipeIngredients = async () => {
      if (ingredients.length === 0 && effectiveRecipeId) {
        try {
          const { data, error } = await supabase
            .from("recipes")
            .select("ingredients")
            .eq("id", effectiveRecipeId)
            .single();

          if (error) {
            console.error("Error fetching recipe ingredients:", error);
            return;
          }

          if (data && data.ingredients) {
            // Safely cast the ingredients to our expected type
            const fetchedIngredients = data.ingredients as
              | RecipeIngredient[]
              | string[];
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
      toast.success(
        newFavoriteStatus ? "Added to favorites" : "Removed from favorites"
      );
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      toast.error("Failed to update favorite status");
    }
  };

  const handleStartCooking = async () => {
    try {
      // Track cooking start locally for now (cook_count field may not exist in schema)
      // Later we can add proper database tracking
      console.log(`Started cooking recipe: ${effectiveRecipeId}`);
      toast.success("Happy cooking! 👨‍🍳");
    } catch (error) {
      console.error("Error tracking cooking start:", error);
      // Don't show error toast - tracking is secondary feature
    }
  };

  const cookTimeInMinutes = recipe?.cook_time
    ? parseInt(recipe.cook_time, 10)
    : 0;

  return (
    <>
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex gap-2">
          <AddToGroceryListButton
            recipeId={effectiveRecipeId}
            ingredients={recipeIngredients}
          />

          <Button
            variant="outline"
            onClick={() => setIsAddToCollectionDialogOpen(true)}
            className="flex-1"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Add to Collection
          </Button>

          {!hideOptions && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleFavoriteToggle}
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${
                    isFavorite ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                {isFavorite ? "Favorited" : "Favorite"}
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
        <Button
          onClick={onAdapt}
          variant="default"
          className="bg-green-600 hover:bg-green-700"
        >
          <ChefHat className="mr-2 h-4 w-4" />
          Adapt for My Diet
        </Button>

        {/* New Feature Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => setIsScaleRecipeOpen(true)}
            className="flex items-center justify-center"
          >
            <Scale className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Scale Recipe</span>
            <span className="sm:hidden">Scale</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsNutritionDialogOpen(true)}
            className="flex items-center justify-center"
          >
            <Apple className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nutrition</span>
            <span className="sm:hidden">Nutrition</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsAddToMealPlanOpen(true)}
            className="flex items-center justify-center"
          >
            <Utensils className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Meal Plan</span>
            <span className="sm:hidden">Plan</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsVersionHistoryOpen(true)}
            className="flex items-center justify-center"
          >
            <History className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Versions</span>
            <span className="sm:hidden">History</span>
          </Button>
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

      <AddToCollectionDialog
        isOpen={isAddToCollectionDialogOpen}
        onClose={() => setIsAddToCollectionDialogOpen(false)}
        recipeId={effectiveRecipeId}
        currentCollections={recipeCollections}
      />

      <RecipeScalerDialog
        isOpen={isScaleRecipeOpen}
        onClose={() => setIsScaleRecipeOpen(false)}
        recipeId={effectiveRecipeId}
        recipeTitle="Current Recipe" // TODO: Pass actual recipe title
        originalIngredients={Array.isArray(recipeIngredients) ? recipeIngredients.map(ing =>
          typeof ing === 'string' ? ing : ing.name || ''
        ) : []}
        originalServings={4} // TODO: Get from recipe data
        onScaled={(scaledIngredients, newServings) => {
          console.log('Recipe scaled:', scaledIngredients, newServings);
          // TODO: Update recipe display with scaled ingredients
        }}
      />

      <NutritionDialog
        isOpen={isNutritionDialogOpen}
        onClose={() => setIsNutritionDialogOpen(false)}
        recipeId={effectiveRecipeId}
        recipeTitle="Current Recipe" // TODO: Pass actual recipe title
        ingredients={Array.isArray(recipeIngredients) ? recipeIngredients.map(ing =>
          typeof ing === 'string' ? ing : ing.name || ''
        ) : []}
        servings={4} // TODO: Get from recipe data
      />

      <AddToMealPlanDialog
        isOpen={isAddToMealPlanOpen}
        onClose={() => setIsAddToMealPlanOpen(false)}
        recipeId={effectiveRecipeId}
        recipeTitle="Current Recipe" // TODO: Pass actual recipe title
      />

      <VersionHistoryDialog
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        recipeId={effectiveRecipeId}
        recipeTitle="Current Recipe" // TODO: Pass actual recipe title
      />
    </>
  );
};

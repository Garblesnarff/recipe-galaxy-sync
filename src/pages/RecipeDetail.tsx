
import { RecipeHeader } from "@/components/recipe/RecipeHeader";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { RecipeIngredientsList } from "@/components/recipe/RecipeIngredientsList";
import { RecipeInstructionsList } from "@/components/recipe/RecipeInstructionsList";
import { RecipeLoadingState } from "@/components/recipe/RecipeLoadingState";
import { RecipeMetadata } from "@/components/recipe/RecipeMetadata";
import { RecipeSource } from "@/components/recipe/RecipeSource";
import { RecipeTags } from "@/components/recipe/RecipeTags";
import { RecipeActions } from "@/components/recipe/RecipeActions";
import { SaleIndicator } from "@/components/SaleIndicator";
import { RecipeEditButton } from "@/components/recipe/RecipeEditButton";
import { DietaryWarnings } from "@/components/recipe/DietaryWarnings";
import { RecipeTimer } from "@/components/recipe/RecipeTimer";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useRecipeDetail } from "@/hooks/useRecipeDetail";
import { AdaptRecipeDialog } from "@/components/recipe/AdaptRecipeDialog";
import { AdaptedRecipeBanner } from "@/components/recipe/AdaptedRecipeBanner";
import { cn } from "@/lib/utils";
import { DietaryRestriction } from "@/types/dietary";

export const RecipeDetail = () => {
  const [showTimer, setShowTimer] = useState(false);
  const {
    recipe,
    isLoading,
    navigateToEdit,
    isFavorite,
    handleToggleFavorite,
    currentServings,
    setCurrentServings,
    isAdapted,
    handleAdaptRecipe,
    handleResetAdaptation
  } = useRecipeDetail();

  const handleTimerClick = () => {
    setShowTimer(true);
  };

  const handleCloseTimer = () => {
    setShowTimer(false);
  };

  if (isLoading || !recipe) {
    return <RecipeLoadingState isLoading={isLoading} />;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 ">
      <div className="flex flex-wrap md:flex-nowrap gap-4">
        <div className="w-full space-y-6">
          <div className="flex items-start justify-between">
            <RecipeEditButton onClick={navigateToEdit} />
          </div>

          {isAdapted && (
            <AdaptedRecipeBanner 
              adaptedFor={recipe.adaptedFor as DietaryRestriction[]} 
              onReset={handleResetAdaptation} 
            />
          )}

          <Card className={cn("p-4", isAdapted && "border-indigo-300")}>
            <div className="space-y-6">
              <RecipeHeader
                title={recipe.title || ""}
                isFavorite={isFavorite}
                onToggleFavorite={handleToggleFavorite}
                rating={recipe.rating}
                ratingsCount={recipe.ratings?.length || 0}
              />

              <RecipeImage imageUrl={recipe.image_url} />

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <AdaptRecipeDialog 
                    recipeId={recipe.id}
                    onAdapt={handleAdaptRecipe}
                  />
                  
                  <SaleIndicator
                    salesCount={2}
                  />
                </div>

                <RecipeTimer
                  minutes={recipe.cook_time ? parseInt(recipe.cook_time) : 0}
                  label={recipe.cook_time ? `${recipe.cook_time} Cooking Time` : ""}
                  isOpen={showTimer}
                  onOpen={handleTimerClick}
                  onClose={handleCloseTimer}
                />
              </div>

              <RecipeMetadata
                prepTime={recipe.prep_time}
                cookTime={recipe.cook_time}
                servings={currentServings}
                difficulty={recipe.difficulty}
                rating={recipe.rating}
                onServingsChange={setCurrentServings}
              />

              <DietaryWarnings
                ingredients={Array.isArray(recipe.ingredients) ? recipe.ingredients : []}
              />

              <RecipeIngredientsList
                ingredients={Array.isArray(recipe.ingredients) ? recipe.ingredients : []}
                servings={recipe.servings}
                currentServings={currentServings}
              />

              <RecipeInstructionsList
                instructions={recipe.instructions || ""}
              />

              <RecipeTags
                categories={recipe.categories}
                cuisineType={recipe.cuisine_type}
                dietTags={recipe.diet_tags}
                cookingMethod={recipe.cooking_method}
                seasonOccasion={recipe.season_occasion}
              />

              <RecipeSource
                sourceUrl={recipe.source_url}
                sourceType={recipe.source_type}
              />

              <RecipeActions
                recipeId={recipe.id}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;

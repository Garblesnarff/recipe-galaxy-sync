
import { RecipeHeader } from "@/components/recipe/RecipeHeader";
import { RecipeLoadingState } from "@/components/recipe/RecipeLoadingState";
import { AdaptedRecipeBanner } from "@/components/recipe/AdaptedRecipeBanner";
import { RecipeContent } from "@/components/recipe/RecipeContent";
import { RecipeEditButton } from "@/components/recipe/RecipeEditButton";
import { useState } from "react";
import { useRecipeDetail } from "@/hooks/useRecipeDetail";
import { DietaryRestriction } from "@/types/dietary";
import { useNavigate } from "react-router-dom";

export const RecipeDetail = () => {
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
    handleResetAdaptation,
  } = useRecipeDetail();
  const navigate = useNavigate();

  if (isLoading || !recipe) {
    return <RecipeLoadingState isLoading={isLoading} />;
  }

  const handleAdaptClick = () => {
    navigate(`/adapt-recipe/${recipe.id}`);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
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

          <RecipeContent
            recipe={recipe}
            isAdapted={isAdapted}
            currentServings={currentServings}
            setCurrentServings={setCurrentServings}
            handleAdaptRecipe={handleAdaptClick}
            handleResetAdaptation={handleResetAdaptation}
            isFavorite={isFavorite}
            handleToggleFavorite={handleToggleFavorite}
          />
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;

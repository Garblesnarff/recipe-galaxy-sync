
import { useState } from "react";
import { AdaptedRecipe } from "@/types/adaptedRecipe";

export function useAdaptedRecipe() {
  const [adaptedRecipe, setAdaptedRecipe] = useState<AdaptedRecipe | null>(null);
  const [isAdapted, setIsAdapted] = useState(false);

  const handleAdaptRecipe = (recipe: AdaptedRecipe) => {
    setAdaptedRecipe(recipe);
    setIsAdapted(true);
  };

  const resetAdaptation = () => {
    setAdaptedRecipe(null);
    setIsAdapted(false);
  };

  return {
    adaptedRecipe,
    isAdapted,
    handleAdaptRecipe,
    resetAdaptation
  };
}


import { useState } from "react";

export function useAdaptedRecipe() {
  const [adaptedRecipe, setAdaptedRecipe] = useState<any>(null);
  const [isAdapted, setIsAdapted] = useState(false);
  
  const handleAdaptRecipe = (recipe: any) => {
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

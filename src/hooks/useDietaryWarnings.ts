
import { useState, useEffect } from "react";
import { DietaryRestriction, IngredientWithWarnings } from "@/types/dietary";
import { getUserDietaryRestrictions, processIngredientsWithDietaryWarnings } from "@/services/dietaryService";

export const useDietaryWarnings = (ingredients: string[]) => {
  const [userRestrictions, setUserRestrictions] = useState<DietaryRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingredientsWithWarnings, setIngredientsWithWarnings] = useState<IngredientWithWarnings[]>([]);
  const [hasWarnings, setHasWarnings] = useState(false);

  useEffect(() => {
    const fetchDietaryInfo = async () => {
      setLoading(true);
      try {
        // Get user's dietary restrictions
        const restrictions = await getUserDietaryRestrictions();
        setUserRestrictions(restrictions);
        
        if (ingredients && ingredients.length > 0 && restrictions.length > 0) {
          // Process ingredients for warnings
          const processed = await processIngredientsWithDietaryWarnings(ingredients, restrictions);
          setIngredientsWithWarnings(processed);
          
          // Check if there are any warnings
          const foundWarnings = processed.some(ing => ing.warnings && ing.warnings.length > 0);
          setHasWarnings(foundWarnings);
        } else {
          setIngredientsWithWarnings(
            ingredients.map(ing => ({ text: ing, warnings: [], substitutions: [] }))
          );
          setHasWarnings(false);
        }
      } catch (error) {
        console.error("Error in useDietaryWarnings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDietaryInfo();
  }, [ingredients]);
  
  return {
    userRestrictions,
    loading,
    ingredientsWithWarnings,
    hasWarnings
  };
};

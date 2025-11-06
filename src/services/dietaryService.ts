import { supabase } from "@/integrations/supabase/client";
import { IngredientClassification, IngredientSubstitution, DietaryRestriction } from "@/types/dietary";
import { SupabaseError } from "@/types/adaptedRecipe";
import { toast } from "sonner";

// Get all ingredient classifications from the database
export const getIngredientClassifications = async (): Promise<IngredientClassification[]> => {
  try {
    const { data, error } = await supabase
      .from('ingredient_classifications')
      .select('*') as unknown as {
        data: IngredientClassification[] | null,
        error: SupabaseError | null
      };

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching ingredient classifications:", error);
    return [];
  }
};

// Get ingredient substitutions for a specific restriction
export const getIngredientSubstitutions = async (
  dietaryRestriction: DietaryRestriction
): Promise<IngredientSubstitution[]> => {
  try {
    const { data, error } = await supabase
      .from('ingredient_substitutions')
      .select('*')
      .eq('dietary_restriction', dietaryRestriction) as unknown as {
        data: IngredientSubstitution[] | null,
        error: SupabaseError | null
      };

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching substitutions for ${dietaryRestriction}:`, error);
    return [];
  }
};

// Get substitutions for a specific ingredient and dietary restriction
export const getSubstitutionsForIngredient = async (
  ingredient: string,
  dietaryRestriction: DietaryRestriction
): Promise<IngredientSubstitution[]> => {
  try {
    // First do an exact match search
    let { data, error } = await supabase
      .from('ingredient_substitutions')
      .select('*')
      .eq('dietary_restriction', dietaryRestriction)
      .eq('original_ingredient', ingredient.toLowerCase().trim()) as unknown as {
        data: IngredientSubstitution[] | null,
        error: SupabaseError | null
      };

    if (error) throw error;

    // If no results, try a partial match search
    if (!data || data.length === 0) {
      const { data: partialData, error: partialError } = await supabase
        .from('ingredient_substitutions')
        .select('*')
        .eq('dietary_restriction', dietaryRestriction)
        .ilike('original_ingredient', `%${ingredient.toLowerCase().trim()}%`) as unknown as {
          data: IngredientSubstitution[] | null,
          error: SupabaseError | null
        };

      if (partialError) throw partialError;
      data = partialData;
    }

    return data || [];
  } catch (error) {
    console.error(`Error fetching substitutions for ${ingredient}:`, error);
    return [];
  }
};

// Check if an ingredient contains an allergen based on ingredient classifications
export const checkIngredientForAllergens = async (
  ingredient: string,
  userRestrictions: DietaryRestriction[]
): Promise<{
  hasWarnings: boolean;
  warnings: { restriction: DietaryRestriction; ingredient: string }[];
}> => {
  try {
    // Clean up ingredient text for searching
    const searchText = ingredient.toLowerCase().trim();
    
    // Get all ingredient classifications
    const classifications = await getIngredientClassifications();
    
    // Check if the ingredient matches any classifications
    const matchedClassifications = classifications.filter(classification => 
      searchText.includes(classification.ingredient_name)
    );
    
    const warnings: { restriction: DietaryRestriction; ingredient: string }[] = [];
    
    // Check each matched classification against user restrictions
    for (const classification of matchedClassifications) {
      if (classification.contains_gluten && userRestrictions.includes('gluten-free')) {
        warnings.push({ restriction: 'gluten-free', ingredient: classification.ingredient_name });
      }
      if (classification.contains_dairy && userRestrictions.includes('dairy-free')) {
        warnings.push({ restriction: 'dairy-free', ingredient: classification.ingredient_name });
      }
      if (classification.contains_eggs && userRestrictions.includes('egg-free')) {
        warnings.push({ restriction: 'egg-free', ingredient: classification.ingredient_name });
      }
      if (classification.contains_nuts && userRestrictions.includes('nut-free')) {
        warnings.push({ restriction: 'nut-free', ingredient: classification.ingredient_name });
      }
      if (classification.contains_soy && userRestrictions.includes('soy-free')) {
        warnings.push({ restriction: 'soy-free', ingredient: classification.ingredient_name });
      }
      if (classification.contains_meat && (userRestrictions.includes('vegetarian') || userRestrictions.includes('vegan'))) {
        warnings.push({ 
          restriction: userRestrictions.includes('vegan') ? 'vegan' : 'vegetarian', 
          ingredient: classification.ingredient_name 
        });
      }
      if (classification.is_animal_product && userRestrictions.includes('vegan')) {
        warnings.push({ restriction: 'vegan', ingredient: classification.ingredient_name });
      }
    }
    
    return {
      hasWarnings: warnings.length > 0,
      warnings
    };
  } catch (error) {
    console.error(`Error checking allergens for ${ingredient}:`, error);
    return { hasWarnings: false, warnings: [] };
  }
};

// Get the user's dietary restrictions from their profile
export const getUserDietaryRestrictions = async (): Promise<DietaryRestriction[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('dietary_restrictions')
      .eq('id', session.user.id)
      .single() as unknown as {
        data: { dietary_restrictions: DietaryRestriction[] } | null,
        error: SupabaseError | null
      };

    if (error) throw error;
    return (data?.dietary_restrictions || []) as DietaryRestriction[];
  } catch (error) {
    console.error("Error fetching user dietary restrictions:", error);
    return [];
  }
};

// Update the user's dietary restrictions
export const updateUserDietaryRestrictions = async (restrictions: DietaryRestriction[]): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      toast.error("You must be logged in to update dietary preferences");
      return false;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ dietary_restrictions: restrictions })
      .eq('id', session.user.id) as unknown as { error: SupabaseError | null };
    
    if (error) throw error;
    
    toast.success("Dietary preferences updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating dietary restrictions:", error);
    toast.error("Failed to update dietary preferences");
    return false;
  }
};

// Process ingredients and check for dietary warnings
export const processIngredientsWithDietaryWarnings = async (
  ingredients: string[],
  userRestrictions: DietaryRestriction[]
) => {
  if (!ingredients || ingredients.length === 0 || userRestrictions.length === 0) {
    return ingredients.map(ing => ({ 
      text: ing, 
      warnings: [], 
      substitutions: [] 
    }));
  }

  const result = await Promise.all(ingredients.map(async (ingredient) => {
    // Skip empty ingredients
    if (!ingredient || ingredient.trim() === '') {
      return { text: ingredient, warnings: [], substitutions: [] };
    }

    // Check for allergens
    const { warnings } = await checkIngredientForAllergens(ingredient, userRestrictions);
    
    // If there are warnings, get substitutions
    let substitutions: IngredientSubstitution[] = [];
    if (warnings.length > 0) {
      // Get unique restrictions that triggered warnings
      const uniqueRestrictions = [...new Set(warnings.map(w => w.restriction))];
      
      // Get substitutions for each restriction
      for (const restriction of uniqueRestrictions) {
        const subs = await getSubstitutionsForIngredient(ingredient, restriction);
        substitutions = [...substitutions, ...subs];
      }
    }

    return {
      text: ingredient,
      warnings,
      substitutions
    };
  }));

  return result;
};

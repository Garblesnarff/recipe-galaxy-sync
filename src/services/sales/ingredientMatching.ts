
import { supabase } from "@/integrations/supabase/client";
import { IngredientMatch } from "./types";
import { normalizeIngredient } from "./utils";

/**
 * Test if an ingredient matches any of the canonical names or variants
 * in the ingredient mappings table. Useful for debugging matching issues.
 */
export const testIngredientMatching = async (
  ingredient: string
): Promise<IngredientMatch | null> => {
  try {
    // Clean and normalize the ingredient
    const normalizedIngredient = normalizeIngredient(ingredient);
    
    // Get ingredient mappings
    const { data: mappingsData, error: mappingsError } = await (supabase
      .from("ingredient_mappings" as any)
      .select("canonical_name, variant_names, category")) as unknown as { 
        data: { canonical_name: string, variant_names: string[], category: string }[], 
        error: any 
      };

    if (mappingsError) {
      console.error("Error fetching ingredient mappings:", mappingsError);
      return null;
    }

    // Find matches
    const matches = mappingsData.filter(mapping => {
      const canonicalMatches = mapping.canonical_name.toLowerCase().includes(normalizedIngredient) || 
                               normalizedIngredient.includes(mapping.canonical_name.toLowerCase());
      
      const variantMatches = mapping.variant_names.some(variant => 
        variant.toLowerCase().includes(normalizedIngredient) || 
        normalizedIngredient.includes(variant.toLowerCase())
      );
      
      return canonicalMatches || variantMatches;
    }).map(mapping => ({
      canonical: mapping.canonical_name,
      variants: mapping.variant_names,
      matchType: mapping.canonical_name.toLowerCase().includes(normalizedIngredient) ? 
        'canonical' : 'variant' as 'direct' | 'canonical' | 'variant'
    }));

    return {
      ingredient,
      matches
    };
  } catch (error) {
    console.error("Error in testIngredientMatching:", error);
    return null;
  }
};

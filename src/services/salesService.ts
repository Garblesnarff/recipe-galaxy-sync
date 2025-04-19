import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SaleItem {
  id: string;
  store_id: string;
  store_name?: string;
  item_name: string;
  sale_price: string;
  regular_price: string;
  discount_percentage: number;
  sale_ends_at: string;
}

export interface IngredientSale {
  ingredient: string;
  sales: SaleItem[];
}

export interface IngredientMatch {
  ingredient: string;
  matches: {
    canonical: string;
    variants: string[];
    matchType: 'direct' | 'canonical' | 'variant';
  }[];
}

/**
 * Fetch sales data for a list of ingredients
 */
export const fetchSalesForIngredients = async (
  ingredients: string[]
): Promise<IngredientSale[]> => {
  if (!ingredients || ingredients.length === 0) {
    return [];
  }

  try {
    // Get all active sales
    const { data: salesData, error: salesError } = await (supabase
      .from("sales" as any)
      .select(`
        id, 
        store_id, 
        item_name, 
        sale_price, 
        regular_price, 
        discount_percentage, 
        sale_ends_at, 
        stores (
          name
        )
      `)) as unknown as { data: SaleItem[], error: any };

    if (salesError) {
      console.error("Error fetching sales data:", salesError);
      return [];
    }

    // Format the sales data
    const formattedSales = salesData.map((sale) => ({
      id: sale.id,
      store_id: sale.store_id,
      store_name: sale.stores?.name,
      item_name: sale.item_name,
      sale_price: sale.sale_price,
      regular_price: sale.regular_price,
      discount_percentage: sale.discount_percentage,
      sale_ends_at: sale.sale_ends_at,
    }));

    // Get ingredient mappings
    const { data: mappingsData, error: mappingsError } = await (supabase
      .from("ingredient_mappings" as any)
      .select("canonical_name, variant_names")) as unknown as { data: { canonical_name: string, variant_names: string[] }[], error: any };

    if (mappingsError) {
      console.error("Error fetching ingredient mappings:", mappingsError);
      return [];
    }

    // Build a map of ingredient variants to canonical names
    const ingredientVariantMap: Record<string, string> = {};
    for (const mapping of mappingsData) {
      ingredientVariantMap[mapping.canonical_name.toLowerCase()] = mapping.canonical_name;
      for (const variant of mapping.variant_names) {
        ingredientVariantMap[variant.toLowerCase()] = mapping.canonical_name;
      }
    }

    // Match ingredients with sales
    const ingredientSales: IngredientSale[] = [];
    
    for (const ingredient of ingredients) {
      // Clean and normalize the ingredient name (remove quantities, units, etc.)
      const cleanedIngredient = normalizeIngredient(ingredient);
      
      // Find sales matching this ingredient
      const matchingSales = formattedSales.filter((sale) => {
        return doesIngredientMatch(cleanedIngredient, sale.item_name, ingredientVariantMap);
      });
      
      if (matchingSales.length > 0) {
        ingredientSales.push({
          ingredient,
          sales: matchingSales,
        });
      }
    }

    return ingredientSales;
  } catch (error) {
    console.error("Error in fetchSalesForIngredients:", error);
    return [];
  }
};

/**
 * Clean an ingredient string to extract just the food item
 */
const normalizeIngredient = (ingredient: string): string => {
  // Remove quantities and units (e.g., "2 cups of milk" -> "milk")
  return ingredient
    .toLowerCase()
    .replace(/^\d+\s*\/?\d*\s*/, "") // Remove quantities like "2" or "1/2"
    .replace(/cups?|tbsps?|tablespoons?|tsps?|teaspoons?|pounds?|lbs?|ounces?|oz|grams?|kilograms?|kg|ml|liters?|l\s+of\s+/g, "")
    .replace(/^\s+|\s+$/g, ""); // Trim whitespace
};

/**
 * Check if an ingredient matches a sale item
 */
const doesIngredientMatch = (
  ingredient: string, 
  saleItem: string, 
  variantMap: Record<string, string>
): boolean => {
  const normalizedIngredient = ingredient.toLowerCase();
  const normalizedSaleItem = saleItem.toLowerCase();
  
  // Direct match
  if (normalizedSaleItem.includes(normalizedIngredient)) {
    return true;
  }
  
  // Check for variant matches using the mapping
  const canonicalName = variantMap[normalizedIngredient];
  if (canonicalName) {
    if (normalizedSaleItem.includes(canonicalName.toLowerCase())) {
      return true;
    }
    
    // Check if any variants of this canonical name are in the sale item
    for (const [variant, canonical] of Object.entries(variantMap)) {
      if (canonical === canonicalName && normalizedSaleItem.includes(variant)) {
        return true;
      }
    }
  }
  
  return false;
};

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

/**
 * Trigger a manual scrape of sales data
 */
export const triggerSalesScrape = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke("scrape-sales");
    
    if (error) {
      console.error("Error triggering sales scrape:", error);
      toast.error("Failed to update sales data");
      return false;
    }
    
    if (data?.success) {
      toast.success("Sales data updated successfully");
      return true;
    } else {
      toast.error("Failed to update sales data: " + (data?.error || "Unknown error"));
      return false;
    }
  } catch (error) {
    console.error("Error in triggerSalesScrape:", error);
    toast.error("An error occurred while updating sales data");
    return false;
  }
};

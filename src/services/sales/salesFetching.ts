
import { supabase } from "@/integrations/supabase/client";
import { IngredientSale, SaleItem } from "./types";
import { doesIngredientMatch, normalizeIngredient } from "./utils";

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
      // Clean and normalize the ingredient name
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

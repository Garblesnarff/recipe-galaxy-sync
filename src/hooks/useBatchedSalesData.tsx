import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IngredientSale, SaleItem } from "@/services/sales/types";
import { SupabaseError } from "@/types/adaptedRecipe";
import { doesIngredientMatch, normalizeIngredient } from "@/services/sales/utils";
import { logError, parseSupabaseError } from "@/lib/errors";
import { withTimeout } from "@/lib/queryClient";

/**
 * Batched sales data result
 */
export interface BatchedSalesData {
  salesByRecipeId: Map<string, IngredientSale[]>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Recipe ingredients result from database
 */
interface RecipeIngredients {
  id: string;
  ingredients: string[] | Record<string, any> | null;
}

/**
 * Hook to fetch sales data for multiple recipes in batched queries
 *
 * Performance optimization: Instead of N+1 queries (1 per recipe), this uses only 3 queries:
 * 1. Fetch all recipe ingredients (1 query for all recipes)
 * 2. Fetch all sales (1 shared query)
 * 3. Fetch all ingredient mappings (1 shared query)
 *
 * For 20 recipes: 3 queries instead of 61 queries (95% reduction!)
 * For 100 recipes: 3 queries instead of 301 queries (99% reduction!)
 *
 * @param recipeIds - Array of recipe IDs to fetch sales data for
 * @param enabled - Whether the query should run (default: true)
 */
export const useBatchedSalesData = (
  recipeIds: string[],
  enabled: boolean = true
): BatchedSalesData => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["batched-sales-data", recipeIds],
    queryFn: async () => {
      if (!recipeIds || recipeIds.length === 0) {
        return new Map<string, IngredientSale[]>();
      }

      try {
        // Step 1: Fetch ALL recipe ingredients in a single query
        const recipesQuery = supabase
          .from("recipes")
          .select("id, ingredients")
          .in("id", recipeIds);

        const { data: recipesData, error: recipesError } = await withTimeout(
          recipesQuery,
          15000,
          new Error("Batched recipes fetch timed out")
        ) as { data: RecipeIngredients[] | null; error: SupabaseError | null };

        if (recipesError) {
          const parsedError = parseSupabaseError(recipesError);
          logError(parsedError, {
            component: "useBatchedSalesData",
            action: "fetch_recipes",
            metadata: { recipeIds },
          });
          throw parsedError;
        }

        if (!recipesData || recipesData.length === 0) {
          return new Map<string, IngredientSale[]>();
        }

        // Parse and collect all unique ingredients across all recipes
        const recipeIngredientMap = new Map<string, string[]>();
        const allIngredients = new Set<string>();

        for (const recipe of recipesData) {
          const ingredientList = parseIngredients(recipe.ingredients);
          recipeIngredientMap.set(recipe.id, ingredientList);

          // Add to global ingredient set
          ingredientList.forEach(ing => allIngredients.add(ing.toLowerCase()));
        }

        // If no ingredients found, return empty map
        if (allIngredients.size === 0) {
          return new Map<string, IngredientSale[]>();
        }

        // Step 2: Fetch ALL sales in a single query (shared across all recipes)
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
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
          `) as unknown as { data: SaleItem[] | null; error: SupabaseError | null };

        if (salesError) {
          const parsedError = parseSupabaseError(salesError);
          logError(parsedError, {
            component: "useBatchedSalesData",
            action: "fetch_sales",
          });
          // Don't throw - sales are optional, continue with empty sales
          return new Map<string, IngredientSale[]>();
        }

        // Step 3: Fetch ALL ingredient mappings in a single query (shared)
        const { data: mappingsData, error: mappingsError } = await supabase
          .from("ingredient_mappings")
          .select("canonical_name, variant_names") as unknown as {
            data: { canonical_name: string; variant_names: string[] }[] | null;
            error: SupabaseError | null;
          };

        if (mappingsError) {
          const parsedError = parseSupabaseError(mappingsError);
          logError(parsedError, {
            component: "useBatchedSalesData",
            action: "fetch_mappings",
          });
          // Don't throw - continue without mappings
        }

        // Build ingredient variant map for matching
        const ingredientVariantMap: Record<string, string> = {};
        if (mappingsData) {
          for (const mapping of mappingsData) {
            ingredientVariantMap[mapping.canonical_name.toLowerCase()] =
              mapping.canonical_name;
            for (const variant of mapping.variant_names) {
              ingredientVariantMap[variant.toLowerCase()] = mapping.canonical_name;
            }
          }
        }

        // Format sales data
        const formattedSales =
          salesData?.map((sale) => ({
            id: sale.id,
            store_id: sale.store_id,
            store_name: sale.stores?.name,
            item_name: sale.item_name,
            sale_price: sale.sale_price,
            regular_price: sale.regular_price,
            discount_percentage: sale.discount_percentage,
            sale_ends_at: sale.sale_ends_at,
          })) || [];

        // Step 4: Match ingredients to sales for each recipe
        const salesByRecipeId = new Map<string, IngredientSale[]>();

        for (const [recipeId, ingredients] of recipeIngredientMap.entries()) {
          const recipeSales: IngredientSale[] = [];

          for (const ingredient of ingredients) {
            const cleanedIngredient = normalizeIngredient(ingredient);

            // Find sales matching this ingredient
            const matchingSales = formattedSales.filter((sale) =>
              doesIngredientMatch(cleanedIngredient, sale.item_name, ingredientVariantMap)
            );

            if (matchingSales.length > 0) {
              recipeSales.push({
                ingredient,
                sales: matchingSales,
              });
            }
          }

          salesByRecipeId.set(recipeId, recipeSales);
        }

        return salesByRecipeId;
      } catch (error) {
        logError(error, {
          component: "useBatchedSalesData",
          action: "batch_fetch",
          metadata: { recipeIds },
        });
        throw error;
      }
    },
    enabled: enabled && recipeIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - sales don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 1, // Only retry once - sales are non-critical
  });

  return {
    salesByRecipeId: data || new Map<string, IngredientSale[]>(),
    isLoading,
    error: error as Error | null,
  };
};

/**
 * Helper to parse ingredients from various formats
 */
function parseIngredients(
  ingredients: string[] | Record<string, any> | null
): string[] {
  if (!ingredients) return [];

  if (Array.isArray(ingredients)) {
    return ingredients.map((ingredient) =>
      typeof ingredient === "string" ? ingredient : String(ingredient)
    );
  } else if (typeof ingredients === "object") {
    return Object.values(ingredients).map((ingredient) =>
      typeof ingredient === "string" ? ingredient : String(ingredient)
    );
  }

  return [];
}

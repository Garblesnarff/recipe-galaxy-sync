
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchSalesForIngredients } from "@/services/sales";
import { IngredientSale } from "@/services/sales";
import { logError, parseSupabaseError } from "@/lib/errors";
import { withTimeout } from "@/lib/queryClient";

/**
 * Hook to fetch sales data for recipe ingredients
 *
 * Features:
 * - Graceful degradation: Returns empty array on error (sales are optional)
 * - Error caching: Prevents retry storms by caching errors
 * - Network timeout: 15 second timeout for sales queries
 * - No cascading failures: Errors don't affect recipe display
 */
export const useSalesData = (recipeId: string) => {
  const [salesData, setSalesData] = useState<IngredientSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const errorCacheRef = useRef<Map<string, number>>(new Map());
  const ERROR_CACHE_DURATION = 5 * 60 * 1000; // Cache errors for 5 minutes

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!recipeId) return;

      // Check error cache to prevent retry storms
      const cachedErrorTime = errorCacheRef.current.get(recipeId);
      if (cachedErrorTime && Date.now() - cachedErrorTime < ERROR_CACHE_DURATION) {
        // Error was recent, skip retry
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        // Fetch recipe ingredients with timeout
        const recipeQuery = supabase
          .from('recipes')
          .select('ingredients')
          .eq('id', recipeId)
          .single();

        const { data, error } = await withTimeout(
          recipeQuery,
          15000, // 15 second timeout for sales (non-critical feature)
          new Error('Sales data fetch timed out')
        );

        if (error) {
          const parsedError = parseSupabaseError(error);

          // Log error but don't throw - sales are optional
          logError(parsedError, {
            component: 'useSalesData',
            action: 'fetch_recipe_ingredients',
            metadata: { recipeId },
          });

          // Cache this error
          errorCacheRef.current.set(recipeId, Date.now());
          setHasError(true);
          setSalesData([]); // Graceful degradation
          return;
        }

        // Parse ingredients
        let ingredientList: string[] = [];
        if (data && data.ingredients) {
          if (Array.isArray(data.ingredients)) {
            ingredientList = data.ingredients.map(ingredient =>
              typeof ingredient === 'string' ? ingredient : String(ingredient)
            );
          } else if (typeof data.ingredients === 'object') {
            ingredientList = Object.values(data.ingredients).map(ingredient =>
              typeof ingredient === 'string' ? ingredient : String(ingredient)
            );
          }
        }

        // Fetch sales if we have ingredients
        if (ingredientList.length > 0) {
          // fetchSalesForIngredients already has error handling and returns [] on error
          const sales = await fetchSalesForIngredients(ingredientList);
          setSalesData(sales);

          // Clear error cache on success
          errorCacheRef.current.delete(recipeId);
        } else {
          setSalesData([]);
        }
      } catch (error) {
        // Log but don't propagate error - sales are a non-critical feature
        logError(error, {
          component: 'useSalesData',
          action: 'fetch_sales_data',
          metadata: { recipeId },
        });

        // Cache this error to prevent retry storms
        errorCacheRef.current.set(recipeId, Date.now());
        setHasError(true);
        setSalesData([]); // Graceful degradation
      } finally {
        setIsLoading(false);
      }
    };

    if (recipeId) {
      fetchSalesData();
    }
  }, [recipeId]);

  return {
    salesData,
    isLoading,
    hasError, // Expose error state so UI can optionally show "Sales unavailable"
  };
};

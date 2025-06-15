
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchSalesForIngredients } from "@/services/sales";
import { IngredientSale } from "@/services/sales";

export const useSalesData = (recipeId: string) => {
  const [salesData, setSalesData] = useState<IngredientSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!recipeId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('ingredients')
          .eq('id', recipeId)
          .single();

        if (error) {
          console.error("Error fetching recipe ingredients:", error);
          return;
        }

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

        if (ingredientList.length > 0) {
          const sales = await fetchSalesForIngredients(ingredientList);
          setSalesData(sales);
        }
      } catch (error) {
        console.error("Error in fetchSalesData:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (recipeId) {
      fetchSalesData();
    }
  }, [recipeId]);

  return { salesData, isLoading };
};

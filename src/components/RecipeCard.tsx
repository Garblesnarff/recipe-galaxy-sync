
import { Card } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchSalesForIngredients, IngredientSale } from "@/services/salesService";
import { SaleIndicator } from "@/components/SaleIndicator";
import { supabase } from "@/integrations/supabase/client";

interface RecipeCardProps {
  id: string;
  title: string;
  description: string;
  image?: string;
  rating: number;
  cookTime?: string;
  difficulty?: string;
}

export const RecipeCard = ({
  id,
  title,
  description,
  image,
  rating,
  cookTime,
  difficulty,
}: RecipeCardProps) => {
  const [salesData, setSalesData] = useState<IngredientSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      try {
        // Fetch the recipe ingredients
        const { data, error } = await supabase
          .from('recipes')
          .select('ingredients')
          .eq('id', id)
          .single();

        if (error) {
          console.error("Error fetching recipe ingredients:", error);
          return;
        }

        // Ensure ingredients are in the right format
        let ingredientList: string[] = [];
        if (Array.isArray(data.ingredients)) {
          ingredientList = data.ingredients;
        } else if (typeof data.ingredients === 'object') {
          // Handle case where ingredients might be stored as an object with keys
          ingredientList = Object.values(data.ingredients);
        }

        if (ingredientList.length > 0) {
          // Fetch sales data for these ingredients
          const sales = await fetchSalesForIngredients(ingredientList);
          setSalesData(sales);
        }
      } catch (error) {
        console.error("Error in fetchSalesData:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchSalesData();
    }
  }, [id]);

  return (
    <Link to={`/recipe/${id}`} className="block">
      <Card className="recipe-card group relative overflow-hidden">
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
            <Check className="h-5 w-5 text-recipe-green" />
          </div>
        </div>
        
        {salesData.length > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <SaleIndicator salesCount={salesData.length} onlyIcon={true} />
          </div>
        )}
        
        <div className="recipe-image">
          {image ? (
            <img
              src={image}
              alt={title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image available
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg leading-tight mb-1">{title}</h3>
            {salesData.length > 0 && (
              <SaleIndicator 
                salesCount={salesData.length} 
                className="ml-2 shrink-0"
                onlyIcon={true}
              />
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
          {(cookTime || difficulty) && (
            <div className="flex gap-3 mt-3 text-xs text-gray-500">
              {cookTime && <span>{cookTime}</span>}
              {difficulty && <span>{difficulty}</span>}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

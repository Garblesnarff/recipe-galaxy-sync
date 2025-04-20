import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { fetchSalesForIngredients } from "@/services/sales";
import { SaleIndicator } from "@/components/SaleIndicator";
import { supabase } from "@/integrations/supabase/client";
import { IngredientSale } from "@/services/sales";
import { RecipeCardImage } from "./recipe/card/RecipeCardImage";
import { RecipeCardMeta } from "./recipe/card/RecipeCardMeta";
import { RecipeCardHeader } from "./recipe/card/RecipeCardHeader";

interface RecipeCardProps {
  id: string;
  title: string;
  description: string;
  image?: string | Record<string, any>;
  rating: number;
  cookTime?: string;
  difficulty?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  tags?: string[];
}

export const RecipeCard = ({
  id,
  title,
  description,
  image,
  rating,
  cookTime,
  difficulty,
  isFavorite = false,
  onFavoriteToggle,
  tags = [],
}: RecipeCardProps) => {
  const [salesData, setSalesData] = useState<IngredientSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('ingredients')
          .eq('id', id)
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

    if (id) {
      fetchSalesData();
    }
  }, [id]);

  return (
    <Link to={`/recipe/${id}`} className="block">
      <Card className="recipe-card group relative overflow-hidden">
        <RecipeCardHeader
          isFavorite={isFavorite}
          onFavoriteToggle={onFavoriteToggle}
          salesCount={salesData.length}
        />
        
        {salesData.length > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <SaleIndicator salesCount={salesData.length} onlyIcon={true} />
          </div>
        )}
        
        <RecipeCardImage image={image} title={title} />
        
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
          
          <RecipeCardMeta
            cookTime={cookTime}
            difficulty={difficulty}
            tags={tags}
          />
        </div>
      </Card>
    </Link>
  );
};

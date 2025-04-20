
import { Card } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { Link } from "react-router-dom";
import { Check, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchSalesForIngredients } from "@/services/sales";
import { SaleIndicator } from "@/components/SaleIndicator";
import { supabase } from "@/integrations/supabase/client";
import { IngredientSale } from "@/services/sales";

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
  
  // Process image URL which could be string or object
  const getProcessedImageUrl = (): string | undefined => {
    if (!image) return undefined;
    
    if (typeof image === 'string') {
      // Try to parse JSON string
      try {
        const parsedImage = JSON.parse(image);
        if (parsedImage.url) {
          return parsedImage.url;
        }
      } catch (e) {
        // Not a JSON string, use as-is
        return image;
      }
    } 
    
    // Handle object with URL property
    if (typeof image === 'object' && !Array.isArray(image)) {
      if (image.url) {
        return image.url;
      }
    }
    
    // Handle array of images
    if (Array.isArray(image) && image.length > 0) {
      const firstItem = image[0];
      if (typeof firstItem === 'string') {
        return firstItem;
      } else if (firstItem?.url) {
        return firstItem.url;
      }
    }
    
    return undefined;
  };
  
  const processedImageUrl = getProcessedImageUrl();

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!id) return;
      
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

        // Convert ingredients to string array
        let ingredientList: string[] = [];
        if (data && data.ingredients) {
          if (Array.isArray(data.ingredients)) {
            // Map each ingredient to a string (handles when Json can be a number, boolean, etc.)
            ingredientList = data.ingredients.map(ingredient => 
              typeof ingredient === 'string' ? ingredient : String(ingredient)
            );
          } else if (typeof data.ingredients === 'object') {
            // Handle case where ingredients might be stored as an object with keys
            ingredientList = Object.values(data.ingredients).map(ingredient => 
              typeof ingredient === 'string' ? ingredient : String(ingredient)
            );
          }
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
        <div className="absolute top-3 right-3 z-10 flex space-x-2">
          {onToggleFavorite && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite();
              }}
              className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center"
            >
              <Heart 
                className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
              />
            </button>
          )}
          
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
          {processedImageUrl ? (
            <img
              src={processedImageUrl}
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
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
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

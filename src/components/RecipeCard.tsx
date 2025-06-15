
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useSalesData } from "@/hooks/useSalesData";
import { SaleIndicator } from "@/components/SaleIndicator";
import { RecipeCardImage } from "./recipe/card/RecipeCardImage";
import { RecipeCardMeta } from "./recipe/card/RecipeCardMeta";
import { RecipeCardHeader } from "./recipe/card/RecipeCardHeader";
import { normalizeImageUrl } from "@/utils/ingredientUtils";
import { memo } from "react";

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
  onDelete?: () => void;
}

const RecipeCard = memo(({
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
  onDelete,
}: RecipeCardProps) => {
  const { salesData } = useSalesData(id);
  const processedImageUrl = normalizeImageUrl(image);

  return (
    <Link to={`/recipe/${id}`} className="block">
      <Card className="recipe-card group relative overflow-hidden">
        <RecipeCardHeader
          isFavorite={isFavorite}
          onFavoriteToggle={onFavoriteToggle}
          salesCount={salesData.length}
          onDeleteClick={onDelete}
          title={title}
        />
        
        {salesData.length > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <SaleIndicator salesCount={salesData.length} onlyIcon={true} />
          </div>
        )}
        
        <RecipeCardImage image={processedImageUrl} title={title} />
        
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
});

RecipeCard.displayName = "RecipeCard";

export { RecipeCard };

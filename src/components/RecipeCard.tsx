
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSalesDataFromContext } from "@/contexts/SalesDataContext";
import { SaleIndicator } from "@/components/SaleIndicator";
import { RecipeCardImage } from "./recipe/card/RecipeCardImage";
import { RecipeCardMeta } from "./recipe/card/RecipeCardMeta";
import { RecipeCardHeader } from "./recipe/card/RecipeCardHeader";
import { normalizeImageUrl } from "@/utils/ingredientUtils";
import { memo, useState } from "react";
import { Heart, Users, CheckCircle, Clock } from "lucide-react";

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
  savesCount?: number;
  recentCooks?: Array<{id: string; name: string; avatar: string}>;
  adaptable?: boolean;
  trending?: boolean;
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
  savesCount = 0,
  recentCooks = [],
  adaptable = true,
  trending = false,
}: RecipeCardProps) => {
  // Use batched sales data from context (performance optimization)
  const { salesData } = useSalesDataFromContext(id);
  const processedImageUrl = normalizeImageUrl(image);
  const [showAdaptButton, setShowAdaptButton] = useState(false);

  // Transform generic titles into benefit-driven headlines
  const getBenefitTitle = (originalTitle: string) => {
    const benefitTitles = {
      'Chicken Alfredo': '15-Minute Chicken Alfredo Your Family Will Beg You To Make Again',
      'Chocolate Chip Cookies': 'Perfect Chocolate Chip Cookies That Turn Out Every Single Time',
      'Beef Stew': 'One-Pot Beef Stew That Makes Your House Smell Like Heaven',
    };
    return benefitTitles[originalTitle as keyof typeof benefitTitles] || originalTitle;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowAdaptButton(true);
  };

  return (
    <div className="block">
      <Card className="recipe-card group relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCardClick}>
        <RecipeCardHeader
          isFavorite={isFavorite}
          onFavoriteToggle={onFavoriteToggle}
          salesCount={salesData.length}
          onDeleteClick={onDelete}
          title={title}
        />
        
        {/* Trending indicator */}
        {trending && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-red-500 text-white text-xs">
              🔥 Trending
            </Badge>
          </div>
        )}
        
        {/* Sales indicator */}
        {salesData.length > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <SaleIndicator salesCount={salesData.length} onlyIcon={true} />
          </div>
        )}
        
        <div className="relative">
          <RecipeCardImage image={processedImageUrl} title={title} />
          
          {/* Social proof overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center space-x-3">
                {savesCount > 0 && (
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    <span>{savesCount} saves</span>
                  </div>
                )}
                {recentCooks.length > 0 && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{recentCooks.length}+ made this</span>
                  </div>
                )}
              </div>
              {adaptable && (
                <Badge className="bg-green-500 text-white text-xs">
                  ✓ Adaptable
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg leading-tight">
              {getBenefitTitle(title)}
            </h3>
          </div>
          
          {/* Success confidence booster */}
          <div className="flex items-center mb-2">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-xs text-green-600 font-medium">
              94% success rate - nearly impossible to mess up!
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
          
          {/* Social proof */}
          {recentCooks.length > 0 && (
            <div className="flex items-center mb-3">
              <div className="flex -space-x-2">
                {recentCooks.slice(0, 3).map(cook => (
                  <img 
                    key={cook.id}
                    className="w-6 h-6 rounded-full border-2 border-white" 
                    src={cook.avatar || '/placeholder-avatar.jpg'}
                    alt={cook.name}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-600 ml-2">
                {recentCooks[0]?.name} and {recentCooks.length - 1}+ others made this recently
              </span>
            </div>
          )}
          
          <RecipeCardMeta
            cookTime={cookTime}
            difficulty={difficulty}
            tags={tags}
          />
          
          {/* Conversion-focused CTA */}
          <div className="mt-4 space-y-2">
            <Link to={`/recipe/${id}`}>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                Make This Tonight 🍽️
              </Button>
            </Link>
            
            {showAdaptButton && adaptable && (
              <Button 
                variant="outline" 
                className="w-full border-green-500 text-green-600 hover:bg-green-50"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle adaptation logic
                }}
              >
                Adapt for MY Diet ✨
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});

RecipeCard.displayName = "RecipeCard";

export { RecipeCard };

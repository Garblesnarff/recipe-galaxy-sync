import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { Heart, Users, CheckCircle, Clock, Star } from "lucide-react";

interface DemoRecipeCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  rating: number;
  cookTime?: string;
  difficulty?: string;
  isFavorite?: boolean;
  tags?: string[];
  savesCount?: number;
  recentCooks?: Array<{id: string; name: string; avatar: string}>;
  adaptable?: boolean;
  trending?: boolean;
}

const DemoRecipeCard = memo(({
  id,
  title,
  description,
  image,
  rating,
  cookTime,
  difficulty,
  isFavorite = false,
  tags = [],
  savesCount = 0,
  recentCooks = [],
  adaptable = true,
  trending = false,
}: DemoRecipeCardProps) => {
  // Transform generic titles into benefit-driven headlines
  const getBenefitTitle = (originalTitle: string) => {
    // The title is already benefit-driven from our demo data
    return originalTitle;
  };

  return (
    <div className="block">
      <Card className="recipe-card group relative overflow-hidden hover:shadow-lg transition-shadow">
        {/* Trending indicator */}
        {trending && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-red-500 text-white text-xs">
              🔥 Trending
            </Badge>
          </div>
        )}
        
        {/* Favorite heart - demo only */}
        <div className="absolute top-3 right-3 z-10">
          <button className="bg-white/80 backdrop-blur rounded-full p-2 hover:bg-white/90 transition-colors">
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
        </div>
        
        <div className="relative">
          <img 
            src={image}
            className="w-full h-48 object-cover"
            alt={title}
            onError={(e) => {
              // Fallback to a solid color if image fails
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-gray-200', 'to-gray-300');
            }}
          />
          
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
          
          {/* Recipe confidence booster */}
          <div className="flex items-center mb-2">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-xs text-green-600 font-medium">
              Designed for cooking success - clear instructions included
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
          
          {/* Recipe metadata */}
          <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
            {cookTime && (
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{cookTime}</span>
              </div>
            )}
            {difficulty && (
              <div className="flex items-center">
                <span>{difficulty}</span>
              </div>
            )}
            {rating && (
              <div className="flex items-center">
                <Star className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
                <span>{rating}</span>
              </div>
            )}
          </div>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Recipe features - no fake social proof */}
          <div className="mb-3">
            <div className="flex items-center text-xs text-blue-600">
              <span className="bg-blue-100 px-2 py-1 rounded text-xs mr-2">🍽️ Demo Recipe</span>
              {adaptable && <span className="text-green-600">✨ Adaptable for your diet</span>}
            </div>
          </div>
          
          {/* Conversion-focused CTAs */}
          <div className="space-y-2">
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              onClick={() => alert(`Demo: Would navigate to recipe ${id}`)}
            >
              Make This Tonight 🍽️
            </Button>
            
            {adaptable && (
              <Button 
                variant="outline" 
                className="w-full border-green-500 text-green-600 hover:bg-green-50"
                onClick={(e) => {
                  e.stopPropagation();
                  alert('Demo: Would open recipe adaptation dialog');
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

DemoRecipeCard.displayName = "DemoRecipeCard";

export { DemoRecipeCard };
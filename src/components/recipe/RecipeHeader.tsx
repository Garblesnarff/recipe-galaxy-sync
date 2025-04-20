
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Share2, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Rating } from "@/components/ui/rating";

interface RecipeHeaderProps {
  title: string;
  description?: string;
  imageUrl?: string | Record<string, any>;
  rating?: number;
  ratingsCount?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const RecipeHeader = ({ 
  title, 
  description,
  imageUrl, 
  rating, 
  ratingsCount = 0,
  isFavorite = false,
  onToggleFavorite
}: RecipeHeaderProps) => {
  const navigate = useNavigate();
  
  // Process image URL which could be string or object
  const getProcessedImageUrl = (): string | undefined => {
    if (!imageUrl) return undefined;
    
    if (typeof imageUrl === 'string') {
      try {
        const parsedUrl = JSON.parse(imageUrl);
        if (parsedUrl && typeof parsedUrl === 'object' && 'url' in parsedUrl) {
          return parsedUrl.url;
        }
      } catch (e) {
        // If parsing fails, just use the string as-is
        return imageUrl;
      }
      return imageUrl;
    } 
    
    // Handle object with URL property
    if (typeof imageUrl === 'object' && !Array.isArray(imageUrl)) {
      if ('url' in imageUrl && imageUrl.url) {
        return imageUrl.url;
      }
    }
    
    // Handle nested arrays
    if (Array.isArray(imageUrl) && imageUrl.length > 0) {
      const firstItem = imageUrl[0];
      if (typeof firstItem === 'string') {
        return firstItem;
      } else if (firstItem && typeof firstItem === 'object' && 'url' in firstItem) {
        return firstItem.url;
      }
    }
    
    return undefined;
  };
  
  const processedImageUrl = getProcessedImageUrl();
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this recipe: ${title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };
  
  return (
    <div className="relative">
      {processedImageUrl ? (
        <div className="h-64 md:h-96 relative">
          <img
            src={processedImageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="h-32 bg-gray-200" />
      )}

      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="bg-white/80 backdrop-blur-sm rounded-full"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5 text-black" />
        </Button>
      </div>
      
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="bg-white/80 backdrop-blur-sm rounded-full"
          onClick={handleShare}
        >
          <Share2 className="h-5 w-5 text-black" />
        </Button>
        
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/80 backdrop-blur-sm rounded-full"
            onClick={onToggleFavorite}
          >
            <Heart 
              className="h-5 w-5" 
              fill={isFavorite ? "rgb(239 68 68)" : "none"}
              stroke={isFavorite ? "rgb(239 68 68)" : "currentColor"}
            />
          </Button>
        )}
      </div>

      <div className="container -mt-16 relative z-10">
        <div className="bg-white rounded-t-3xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          
          <div className="flex items-center gap-2 mb-4">
            <Rating value={rating || 0} readonly className="flex" />
            <span className="text-sm text-gray-500">
              ({ratingsCount} ratings)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

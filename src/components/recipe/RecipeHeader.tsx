
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Share2, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Rating } from "@/components/ui/rating";

interface RecipeHeaderProps {
  title: string;
  imageUrl?: string;
  rating?: number;
  ratingsCount: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const RecipeHeader = ({ 
  title, 
  imageUrl, 
  rating, 
  ratingsCount,
  isFavorite = false,
  onToggleFavorite
}: RecipeHeaderProps) => {
  const navigate = useNavigate();
  
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
      {imageUrl ? (
        <div className="h-64 md:h-96 relative">
          <img
            src={imageUrl}
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

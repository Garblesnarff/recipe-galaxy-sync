
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RecipeHeaderProps {
  title: string;
  imageUrl?: string;
  rating?: number;
  ratingsCount: number;
}

export const RecipeHeader = ({ title, imageUrl, rating, ratingsCount }: RecipeHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="relative">
      {imageUrl ? (
        <div className="h-64 md:h-80 relative">
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

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full z-10"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-5 w-5 text-black" />
      </Button>

      <div className="container -mt-16 relative z-10">
        <div className="bg-white rounded-t-3xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 mr-1" />
              <span className="text-sm font-medium">{rating || '0'}</span>
            </div>
            <span className="text-sm text-gray-500">
              ({ratingsCount} ratings)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

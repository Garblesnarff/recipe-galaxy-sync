
import { Button } from "@/components/ui/button";
import { Heart, Check } from "lucide-react";

interface RecipeCardHeaderProps {
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  salesCount: number;
}

export const RecipeCardHeader = ({ isFavorite = false, onFavoriteToggle, salesCount }: RecipeCardHeaderProps) => {
  return (
    <>
      <div className="absolute top-3 right-3 z-10 flex space-x-2">
        {onFavoriteToggle && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              onFavoriteToggle();
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
    </>
  );
};

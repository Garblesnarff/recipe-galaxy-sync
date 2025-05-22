
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteRecipeDialog } from "../DeleteRecipeDialog";

interface RecipeCardHeaderProps {
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  salesCount: number;
  onDeleteClick?: () => void;
  title: string;
}

export const RecipeCardHeader = ({ 
  isFavorite = false, 
  onFavoriteToggle, 
  salesCount,
  onDeleteClick,
  title
}: RecipeCardHeaderProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    onDeleteClick?.();
  };

  return (
    <>
      <div className="absolute top-3 right-3 z-10 flex space-x-2">
        {onFavoriteToggle && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFavoriteToggle();
            }}
            className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center"
            data-testid="favorite-button"
          >
            <Heart 
              className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
              data-testid="heart-icon"
            />
          </button>
        )}
        
        <button
          onClick={handleDelete}
          className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50"
        >
          <Trash2 className="h-5 w-5 text-gray-400 hover:text-red-500" />
        </button>
      </div>

      <DeleteRecipeDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        recipeName={title}
      />
    </>
  );
};

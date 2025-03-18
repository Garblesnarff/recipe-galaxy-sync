
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Star, Bookmark, Timer, Users, Share } from "lucide-react";
import { AddToGroceryListButton } from "@/components/grocery/AddToGroceryListButton";
import { RecipeTimer } from "@/components/recipe/RecipeTimer";
import { Collection } from "@/types/collection";
import { fetchRecipeCollections } from "@/services/collectionService";
import { AddToCollectionDialog } from "@/components/collections/AddToCollectionDialog";
import { useQuery } from "@tanstack/react-query";

interface RecipeActionsProps {
  ingredients: string[];
  recipeId: string;
  onRateClick: () => void;
  servings: number;
  onServingsChange: (servings: number) => void;
  cookTime?: number;
}

export const RecipeActions = ({
  ingredients,
  recipeId,
  onRateClick,
  servings,
  onServingsChange,
  cookTime
}: RecipeActionsProps) => {
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  
  // Fetch collections that contain this recipe
  const { data: recipeCollections = [] } = useQuery({
    queryKey: ["recipeCollections", recipeId],
    queryFn: () => fetchRecipeCollections(recipeId)
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          text: "Check out this recipe!",
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
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onRateClick}>
          <Star className="mr-1 h-4 w-4" /> Rate
        </Button>
        
        <Button variant="outline" onClick={() => setIsCollectionDialogOpen(true)}>
          <Bookmark className="mr-1 h-4 w-4" /> {recipeCollections.length > 0 ? "In Collections" : "Save"}
        </Button>
        
        <Button variant="outline" onClick={handleShare}>
          <Share className="mr-1 h-4 w-4" /> Share
        </Button>
        
        <AddToGroceryListButton 
          recipeId={recipeId} 
          ingredients={ingredients} 
          servings={servings}
        />
      </div>
      
      <div className="flex flex-wrap gap-4 items-center">
        {cookTime && cookTime > 0 && (
          <div>
            <RecipeTimer 
              initialMinutes={cookTime} 
              label="Start Timer"
            />
          </div>
        )}
        
        <div className="flex items-center">
          <Users className="mr-1 h-4 w-4 text-gray-500" />
          <span className="mr-2">Servings:</span>
          <div className="flex items-center">
            <button
              className="w-8 h-8 flex items-center justify-center border rounded-l-md"
              onClick={() => onServingsChange(Math.max(1, servings - 1))}
              disabled={servings <= 1}
            >
              -
            </button>
            <span className="w-8 h-8 flex items-center justify-center border-t border-b">
              {servings}
            </span>
            <button
              className="w-8 h-8 flex items-center justify-center border rounded-r-md"
              onClick={() => onServingsChange(servings + 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      <AddToCollectionDialog 
        isOpen={isCollectionDialogOpen}
        onClose={() => setIsCollectionDialogOpen(false)}
        recipeId={recipeId}
        currentCollections={recipeCollections}
      />
    </div>
  );
};


import { Button } from "@/components/ui/button";
import { AddToGroceryListButton } from "@/components/grocery/AddToGroceryListButton";
import { Star, Printer, Timer, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { RecipeTimer } from "./RecipeTimer";

interface RecipeActionsProps {
  ingredients: string[];
  recipeId: string;
  onRateClick: () => void;
  servings: number;
  onServingsChange: (servings: number) => void;
  cookTime?: number; // Add optional cookTime prop
}

export const RecipeActions = ({ 
  ingredients, 
  recipeId, 
  onRateClick,
  servings,
  onServingsChange,
  cookTime
}: RecipeActionsProps) => {
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleServingsChange = (delta: number) => {
    const newServings = Math.max(1, servings + delta);
    onServingsChange(newServings);
  };

  const handleOpenTimer = () => {
    setIsTimerOpen(true);
  };
  
  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="font-medium">Servings</div>
        <div className="flex items-center border rounded-md">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2" 
            onClick={() => handleServingsChange(-1)}
            disabled={servings <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="mx-2 font-medium">{servings}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2" 
            onClick={() => handleServingsChange(1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <AddToGroceryListButton 
          variant="outline" 
          className="flex-1"
          ingredients={ingredients}
          recipeId={recipeId}
        />
        <Button variant="app" className="flex-1" onClick={onRateClick}>
          <Star className="mr-1 h-4 w-4" /> Rate Recipe
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="flex-1" onClick={handlePrint}>
          <Printer className="mr-1 h-4 w-4" /> Print Recipe
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleOpenTimer}>
          <Timer className="mr-1 h-4 w-4" /> Start Timer
        </Button>
      </div>

      <RecipeTimer 
        isOpen={isTimerOpen} 
        onOpenChange={setIsTimerOpen} 
        initialTime={cookTime ? Math.floor(cookTime / 60) : 0} 
      />
    </div>
  );
};

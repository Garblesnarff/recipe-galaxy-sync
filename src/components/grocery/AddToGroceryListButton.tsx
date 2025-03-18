
import { Button, ButtonProps } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { addIngredientsToGroceryList } from "@/services/groceryService";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface AddToGroceryListButtonProps extends ButtonProps {
  ingredients: string[];
  recipeId: string;
}

export const AddToGroceryListButton = ({
  ingredients,
  recipeId,
  className,
  ...props
}: AddToGroceryListButtonProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<{[key: number]: boolean}>({});

  const cleanIngredientText = (text: string): string => {
    return text
      .replace(/^[▢□■◆○◯✓✅⬜⬛☐☑︎☑️]/u, '')
      .replace(/^\s*[-•*]\s*/, '')
      .replace(/^Ingredients\s+\d+x\s+\d+x\s+\d+x$/, 'Ingredients')
      .trim();
  };

  const handleSelectAll = () => {
    const allSelected = ingredients.reduce((acc, _, index) => {
      acc[index] = true;
      return acc;
    }, {} as {[key: number]: boolean});
    setSelectedIngredients(allSelected);
  };

  const handleDeselectAll = () => {
    setSelectedIngredients({});
  };

  const handleOpenDialog = () => {
    // Initialize all ingredients as selected by default
    handleSelectAll();
    setIsDialogOpen(true);
  };

  const toggleIngredient = (index: number) => {
    setSelectedIngredients(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleAddToGroceryList = async () => {
    if (!ingredients || ingredients.length === 0) {
      return;
    }

    setIsAdding(true);
    try {
      const selectedItems = ingredients.filter((_, index) => selectedIngredients[index]);
      
      if (selectedItems.length === 0) {
        toast.error("No ingredients selected");
        setIsAdding(false);
        return;
      }
      
      await addIngredientsToGroceryList(selectedItems, recipeId);
      setIsDialogOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        disabled={isAdding || !ingredients || ingredients.length === 0}
        className={className}
        {...props}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add to grocery list
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select ingredients to add</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-between my-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>
          
          <div className="max-h-[50vh] overflow-y-auto my-2">
            <ul className="space-y-3">
              {ingredients.map((ingredient, index) => {
                const cleanedIngredient = cleanIngredientText(ingredient);
                if (!cleanedIngredient || /^Ingredients\s+\d+x\s+\d+x\s+\d+x$/.test(ingredient)) {
                  return null;
                }
                
                return (
                  <li key={index} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`ingredient-${index}`}
                      checked={!!selectedIngredients[index]} 
                      onCheckedChange={() => toggleIngredient(index)}
                    />
                    <label 
                      htmlFor={`ingredient-${index}`}
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      {cleanedIngredient}
                    </label>
                  </li>
                );
              }).filter(Boolean)}
            </ul>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="app" 
              onClick={handleAddToGroceryList}
              disabled={isAdding}
            >
              {isAdding ? "Adding..." : "Add Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

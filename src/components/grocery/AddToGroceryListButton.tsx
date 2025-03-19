
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { addIngredientsToGroceryList } from "@/services/groceryService";
import { toast } from "sonner";
import { RecipeIngredient } from "@/types/recipeIngredient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface AddToGroceryListButtonProps {
  recipeId: string;
  ingredients: RecipeIngredient[] | string[];
}

export const AddToGroceryListButton = ({ 
  recipeId, 
  ingredients 
}: AddToGroceryListButtonProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [processedIngredients, setProcessedIngredients] = useState<string[]>([]);
  
  // Process ingredients whenever they change
  useEffect(() => {
    // Format ingredients to strings for display and selection
    const formatted = ingredients.map(ing => {
      if (typeof ing === 'string') {
        return ing.trim();
      } else if (ing && typeof ing === 'object' && 'name' in ing) {
        // Format structured ingredient with proper checks
        const { quantity, unit, name } = ing;
        if (!name) return ''; // Skip ingredients without a name
        return [quantity || '', unit || '', name || ''].filter(Boolean).join(' ').trim();
      }
      return ''; // Return empty string for invalid items
    }).filter(ing => ing.trim() !== ''); // Filter out empty strings
    
    setProcessedIngredients(formatted);
    console.log("Processed ingredients:", formatted);
  }, [ingredients]);

  // Initialize all ingredients as selected when opening dialog
  const initializeSelection = () => {
    setSelectedIngredients([...processedIngredients]);
  };

  // Open dialog and initialize selected ingredients
  const handleOpenDialog = () => {
    initializeSelection();
    setIsDialogOpen(true);
  };

  // Toggle selection of an ingredient
  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient)
        ? prev.filter(ing => ing !== ingredient)
        : [...prev, ingredient]
    );
  };

  // Handle adding selected ingredients to grocery list
  const handleAddToGroceryList = async () => {
    if (!selectedIngredients || selectedIngredients.length === 0) {
      toast.error("No ingredients selected");
      return;
    }

    setIsAdding(true);
    try {
      console.log("Adding ingredients to grocery list:", selectedIngredients);
      const success = await addIngredientsToGroceryList(selectedIngredients, recipeId);
      if (success) {
        toast.success("Added to grocery list");
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to add to grocery list", error);
      toast.error("Failed to add to grocery list");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="flex-1" 
        onClick={handleOpenDialog}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add to Grocery List
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add ingredients to grocery list</DialogTitle>
            <DialogDescription>
              Select ingredients to add to your grocery list
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedIngredients(processedIngredients)}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedIngredients([])}
              >
                Deselect All
              </Button>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {processedIngredients.length > 0 ? (
                processedIngredients.map((ingredient, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Checkbox 
                      id={`ingredient-${index}`}
                      checked={selectedIngredients.includes(ingredient)}
                      onCheckedChange={() => toggleIngredient(ingredient)}
                    />
                    <Label 
                      htmlFor={`ingredient-${index}`}
                      className="text-sm leading-tight cursor-pointer"
                    >
                      {ingredient}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-gray-500">
                  No ingredients found
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddToGroceryList} 
              disabled={isAdding || selectedIngredients.length === 0}
            >
              {isAdding ? "Adding..." : "Add to Grocery List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddToGroceryListButton;

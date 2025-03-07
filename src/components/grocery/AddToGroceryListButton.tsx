
import { Button, ButtonProps } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { addIngredientsToGroceryList } from "@/services/groceryService";
import { useState } from "react";

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

  const handleAddToGroceryList = async () => {
    if (!ingredients || ingredients.length === 0) {
      return;
    }

    setIsAdding(true);
    try {
      await addIngredientsToGroceryList(ingredients, recipeId);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      onClick={handleAddToGroceryList}
      disabled={isAdding || !ingredients || ingredients.length === 0}
      className={className}
      {...props}
    >
      {isAdding ? (
        "Adding..."
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to grocery list
        </>
      )}
    </Button>
  );
};

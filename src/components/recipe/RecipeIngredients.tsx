
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RecipeIngredientsProps {
  ingredients: string[];
  currentIngredient: string;
  onIngredientChange: (value: string) => void;
  onAddIngredient: (e: React.FormEvent) => void;
  onRemoveIngredient: (index: number) => void;
}

export const RecipeIngredients = ({
  ingredients,
  currentIngredient,
  onIngredientChange,
  onAddIngredient,
  onRemoveIngredient
}: RecipeIngredientsProps) => {
  return (
    <div>
      <Label htmlFor="ingredient-input">Ingredients</Label>
      <div className="flex gap-2 mb-2">
        <Input
          id="ingredient-input"
          value={currentIngredient}
          onChange={(e) => onIngredientChange(e.target.value)}
          placeholder="Add an ingredient"
        />
        <Button type="button" onClick={onAddIngredient}>Add</Button>
      </div>
      <ul className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
            {ingredient}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveIngredient(index)}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

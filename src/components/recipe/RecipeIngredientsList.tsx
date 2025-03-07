
import { Check } from "lucide-react";

interface RecipeIngredientsListProps {
  ingredients: string[];
}

export const RecipeIngredientsList = ({ ingredients }: RecipeIngredientsListProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Ingredients</h2>
      <ul className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="flex items-center">
            <div className="checkbox-circle mr-3">
              <Check className="h-3 w-3 opacity-0 transition-opacity" />
            </div>
            <span className="text-gray-800">{ingredient}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

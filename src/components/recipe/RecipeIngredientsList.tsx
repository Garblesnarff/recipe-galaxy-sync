
import { Check } from "lucide-react";

interface RecipeIngredientsListProps {
  ingredients: string[];
}

export const RecipeIngredientsList = ({ ingredients }: RecipeIngredientsListProps) => {
  // This helper function cleans the ingredient text by removing various box symbols
  // and other common prefixes that might appear in scraped recipes
  const cleanIngredientText = (text: string): string => {
    return text
      .replace(/^[▢□■◆○◯✓✅⬜⬛☐☑︎☑️]/u, '') // Remove various box/bullet symbols at start
      .replace(/^\s*[-•*]\s*/, '') // Remove bullet points
      .replace(/^Ingredients\s+\d+x\s+\d+x\s+\d+x$/, 'Ingredients') // Clean up "Ingredients 1x 2x 3x" text
      .trim();
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Ingredients</h2>
      <ul className="space-y-2">
        {ingredients.map((ingredient, index) => {
          // Skip rendering the "Ingredients 1x 2x 3x" text entirely
          if (/^Ingredients\s+\d+x\s+\d+x\s+\d+x$/.test(ingredient)) {
            return null;
          }
          
          const cleanedIngredient = cleanIngredientText(ingredient);
          
          // Skip empty ingredients after cleaning
          if (!cleanedIngredient) {
            return null;
          }
          
          return (
            <li key={index} className="flex items-center">
              <div className="checkbox-circle mr-3">
                <Check className="h-3 w-3 opacity-0 transition-opacity" />
              </div>
              <span className="text-gray-800">{cleanedIngredient}</span>
            </li>
          );
        }).filter(Boolean)}
      </ul>
    </div>
  );
};

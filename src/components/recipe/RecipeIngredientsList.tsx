import { useState } from "react";
import { Check, CheckSquare, Square, Copy, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useDietaryWarnings } from "@/hooks/useDietaryWarnings";
import { DietaryWarnings } from "@/components/recipe/DietaryWarnings";
import { IngredientSubstitutionDialog } from "@/components/recipe/IngredientSubstitutionDialog";

interface RecipeIngredientsListProps {
  ingredients: string[];
  servings?: number;
  originalServings?: number;
  currentServings?: number;
}

export const RecipeIngredientsList = ({ 
  ingredients, 
  servings = 0,
  originalServings = 0,
  currentServings
}: RecipeIngredientsListProps) => {
  const effectiveServings = currentServings !== undefined ? currentServings : servings;
  const [checkedIngredients, setCheckedIngredients] = useState<{[key: number]: boolean}>({});
  
  const { ingredientsWithWarnings, hasWarnings, userRestrictions, loading } = useDietaryWarnings(ingredients);
  
  const cleanIngredientText = (text: string): string => {
    return text
      .replace(/^[▢□■◆○◯✓✅⬜⬛☐☑︎☑️]/u, '') // Remove various box/bullet symbols at start
      .replace(/^\s*[-•*]\s*/, '') // Remove bullet points
      .replace(/^Ingredients\s+\d+x\s+\d+x\s+\d+x$/, 'Ingredients') // Clean up "Ingredients 1x 2x 3x" text
      .trim();
  };

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const copyIngredientsToClipboard = () => {
    const ingredientsList = ingredients
      .map(cleanIngredientText)
      .filter(Boolean)
      .join("\n");
    
    navigator.clipboard.writeText(ingredientsList).then(() => {
      toast.success("Ingredients copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy ingredients");
    });
  };

  const getScaledIngredient = (ingredient: string) => {
    if (!effectiveServings || !originalServings || effectiveServings === originalServings) {
      return ingredient;
    }
    
    const ratio = effectiveServings / originalServings;
    
    const quantityRegex = /^(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+)\s+/;
    
    const match = ingredient.match(quantityRegex);
    
    if (!match) return ingredient;
    
    const originalQuantity = match[1];
    let scaledQuantity;
    
    if (originalQuantity.includes('/')) {
      if (originalQuantity.includes(' ')) {
        const [whole, fraction] = originalQuantity.split(' ');
        const [numerator, denominator] = fraction.split('/').map(Number);
        const decimal = Number(whole) + (numerator / denominator);
        const scaled = decimal * ratio;
        scaledQuantity = scaled.toFixed(1);
      } else {
        const [numerator, denominator] = originalQuantity.split('/').map(Number);
        const decimal = numerator / denominator;
        const scaled = decimal * ratio;
        scaledQuantity = scaled.toFixed(1);
      }
    } else {
      const scaled = parseFloat(originalQuantity) * ratio;
      scaledQuantity = scaled.toFixed(1).replace(/\.0$/, '');
    }
    
    return ingredient.replace(quantityRegex, `${scaledQuantity} `);
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Ingredients</h2>
        {ingredients.length > 0 && (
          <button 
            onClick={copyIngredientsToClipboard}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy All
          </button>
        )}
      </div>
      
      {effectiveServings > 0 && originalServings > 0 && (
        <div className="mb-4">
          <Badge variant="outline" className="bg-recipe-green-light text-recipe-green-dark">
            Recipe scaled for {effectiveServings} servings
          </Badge>
        </div>
      )}
      
      {hasWarnings && !loading && (
        <DietaryWarnings 
          ingredientsWithWarnings={ingredientsWithWarnings} 
          userRestrictions={userRestrictions}
        />
      )}
      
      <ul className="space-y-2">
        {ingredientsWithWarnings.map((ingredientWithWarnings, index) => {
          const { text: ingredient, warnings, substitutions } = ingredientWithWarnings;
          
          if (/^Ingredients\s+\d+x\s+\d+x\s+\d+x$/.test(ingredient)) {
            return null;
          }
          
          let displayIngredient = cleanIngredientText(ingredient);
          
          if (effectiveServings && originalServings) {
            displayIngredient = getScaledIngredient(displayIngredient);
          }
          
          if (!displayIngredient) {
            return null;
          }
          
          const isChecked = !!checkedIngredients[index];
          const hasWarning = warnings && warnings.length > 0;
          
          return (
            <li key={index} className={`flex items-start ${hasWarning ? 'bg-amber-50 p-2 rounded border border-amber-200' : ''}`}>
              <button 
                onClick={() => toggleIngredient(index)} 
                className="flex-shrink-0 mt-0.5 mr-3"
              >
                {isChecked ? (
                  <CheckSquare className="h-5 w-5 text-recipe-green" />
                ) : (
                  <Square className="h-5 w-5 text-gray-400" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-start">
                  <span className={`text-gray-800 ${isChecked ? 'line-through text-gray-500' : ''}`}>
                    {displayIngredient}
                  </span>
                  
                  {hasWarning && (
                    <IngredientSubstitutionDialog 
                      ingredient={displayIngredient}
                      substitutions={substitutions}
                      restrictions={warnings}
                    />
                  )}
                </div>
                
                {hasWarning && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {warnings.map((warning, widx) => (
                      <span key={widx} className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-0.5" />
                        {warning.restriction}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        }).filter(Boolean)}
      </ul>
    </div>
  );
};

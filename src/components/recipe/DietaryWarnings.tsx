
import { AlertTriangle } from "lucide-react";
import { IngredientWithWarnings, DietaryRestriction } from "@/types/dietary";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useDietaryWarnings } from "@/hooks/useDietaryWarnings";

interface DietaryWarningsProps {
  ingredientsWithWarnings?: IngredientWithWarnings[];
  userRestrictions?: DietaryRestriction[];
  ingredients?: string[];
}

export const DietaryWarnings = ({ 
  ingredientsWithWarnings: propIngredientsWithWarnings, 
  userRestrictions: propUserRestrictions,
  ingredients = []
}: DietaryWarningsProps) => {
  // If raw ingredients are provided, use the hook to process them
  const hookResult = useDietaryWarnings(ingredients);
  
  // Use either provided values or ones from the hook
  const ingredientsWithWarnings = propIngredientsWithWarnings || hookResult.ingredientsWithWarnings;
  const userRestrictions = propUserRestrictions || hookResult.userRestrictions;
  
  if (!ingredientsWithWarnings?.length || !userRestrictions?.length) {
    return null;
  }
  
  // Count warnings for each restriction
  const restrictionCounts: Record<DietaryRestriction, number> = {
    'gluten-free': 0,
    'dairy-free': 0,
    'egg-free': 0,
    'nut-free': 0,
    'soy-free': 0,
    'vegetarian': 0,
    'vegan': 0
  };
  
  // Count warnings
  ingredientsWithWarnings.forEach(ingredient => {
    ingredient.warnings.forEach(warning => {
      restrictionCounts[warning.restriction]++;
    });
  });
  
  // Get active restrictions with warnings
  const activeRestrictions = userRestrictions.filter(
    restriction => restrictionCounts[restriction] > 0
  );
  
  if (activeRestrictions.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-4 border border-amber-200 bg-amber-50 p-3 rounded-md">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="font-medium text-amber-800">Dietary Warnings</h3>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {activeRestrictions.map(restriction => (
          <TooltipProvider key={restriction}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                  {restriction}: {restrictionCounts[restriction]} {restrictionCounts[restriction] === 1 ? 'ingredient' : 'ingredients'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">This recipe contains ingredients that don't match your {restriction} preference</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      
      <p className="text-sm text-amber-700">
        This recipe contains ingredients that don't meet your dietary preferences. 
        See highlighted ingredients below for substitution options.
      </p>
    </div>
  );
};


import { useState } from "react";
import { IngredientSubstitution, DietaryRestriction } from "@/types/dietary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReplacementIcon } from "@/components/ui/replacement-icon";

interface IngredientSubstitutionDialogProps {
  ingredient: string;
  substitutions: IngredientSubstitution[];
  restrictions: { restriction: DietaryRestriction; ingredient: string }[];
}

export const IngredientSubstitutionDialog = ({
  ingredient,
  substitutions,
  restrictions
}: IngredientSubstitutionDialogProps) => {
  const [open, setOpen] = useState(false);
  
  if (!substitutions || substitutions.length === 0) {
    return null;
  }
  
  // Format the restriction names for display
  const restrictionLabels = restrictions.map(r => r.restriction).join(', ');
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-2 px-1 h-6 text-amber-500 hover:text-amber-700 hover:bg-amber-50"
        >
          <span className="sr-only">View substitutions</span>
          <ReplacementIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Substitution Options for {ingredient}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <div className="flex flex-wrap gap-1 mb-2">
              {restrictions.map((r, i) => (
                <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {r.restriction}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              This ingredient may not be suitable for your {restrictionLabels} preferences.
              Consider these alternatives:
            </p>
          </div>
          
          <div className="space-y-3">
            {substitutions.map((sub, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded border">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{sub.substitute_ingredient}</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {sub.dietary_restriction}
                  </span>
                </div>
                
                {sub.substitution_context && (
                  <p className="text-xs text-gray-500 mt-1">
                    Best for: {sub.substitution_context}
                  </p>
                )}
                
                {sub.notes && (
                  <p className="text-sm mt-2">{sub.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

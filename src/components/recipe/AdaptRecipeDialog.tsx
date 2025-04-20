
import { useState } from "react";
import { adaptRecipeForDietaryRestrictions } from "@/services/recipe";
import { DietaryRestriction } from "@/types/dietary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface AdaptRecipeDialogProps {
  recipeId: string;
  onAdapt: (adaptedRecipe: any) => void;
}

export const AdaptRecipeDialog = ({ recipeId, onAdapt }: AdaptRecipeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [selectedRestrictions, setSelectedRestrictions] = useState<DietaryRestriction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const dietaryOptions: { value: DietaryRestriction; label: string }[] = [
    { value: 'gluten-free', label: 'Gluten-Free' },
    { value: 'dairy-free', label: 'Dairy-Free' },
    { value: 'egg-free', label: 'Egg-Free' },
    { value: 'nut-free', label: 'Nut-Free' },
    { value: 'soy-free', label: 'Soy-Free' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' }
  ];

  const handleToggleRestriction = (restriction: DietaryRestriction) => {
    setSelectedRestrictions(prev => 
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleAdaptRecipe = async () => {
    if (selectedRestrictions.length === 0) {
      setError("Please select at least one dietary restriction");
      return;
    }

    setIsAdapting(true);
    setError(null);

    try {
      console.log(`Adapting recipe ${recipeId} for restrictions: ${selectedRestrictions.join(', ')}`);
      const adaptedRecipe = await adaptRecipeForDietaryRestrictions(recipeId, selectedRestrictions);
      
      if (!adaptedRecipe) {
        throw new Error("Failed to adapt recipe");
      }
      
      // Call the callback with the adapted recipe
      onAdapt(adaptedRecipe);
      
      // Close the dialog
      setOpen(false);
      
      // Show success message
      toast.success(`Recipe adapted for ${selectedRestrictions.join(', ')}`);
      
      // Reset retry count on success
      setRetryCount(0);
      
      // Show substitution information
      if (adaptedRecipe.substitutions && adaptedRecipe.substitutions.length > 0) {
        const substitutionInfo = adaptedRecipe.substitutions.map(
          (sub: any) => `• ${sub.original} → ${sub.substitute}`
        ).join('\n');
        
        toast.info("Substitutions made", {
          description: substitutionInfo,
          duration: 8000,
        });
      }
    } catch (error) {
      console.error("Error adapting recipe:", error);
      setRetryCount(prev => prev + 1);
      
      let errorMessage = "Failed to adapt recipe";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // If there's a specific API error, show it
      if (errorMessage.includes('Groq API error')) {
        setError(`AI service error: ${errorMessage}`);
      } else if (retryCount >= 2) {
        // After multiple retries, show more detailed troubleshooting info
        setError(`${errorMessage}. This may be due to temporary AI service issues or configuration problems.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsAdapting(false);
    }
  };

  const resetForm = () => {
    setSelectedRestrictions([]);
    setError(null);
    setRetryCount(0);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Adapt Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adapt Recipe for Dietary Needs</DialogTitle>
          <DialogDescription>
            Select dietary restrictions and our AI will adapt this recipe with appropriate substitutions
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {dietaryOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`restriction-${option.value}`}
                  checked={selectedRestrictions.includes(option.value)}
                  onCheckedChange={() => handleToggleRestriction(option.value)}
                />
                <Label
                  htmlFor={`restriction-${option.value}`}
                  className="font-medium cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col space-y-2">
          <Button
            onClick={handleAdaptRecipe}
            disabled={isAdapting || selectedRestrictions.length === 0}
            className="w-full"
          >
            {isAdapting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adapting Recipe...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Adapt Recipe
              </>
            )}
          </Button>
          
          {retryCount > 0 && (
            <p className="text-xs text-gray-500 text-center">
              Having trouble? Try selecting fewer dietary restrictions or try again later.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

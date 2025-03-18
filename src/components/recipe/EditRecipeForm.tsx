
import { Button } from "@/components/ui/button";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { RecipeIngredients } from "@/components/recipe/RecipeIngredients";
import { RecipeDetails } from "@/components/recipe/RecipeDetails";
import { RecipeInstructions } from "@/components/recipe/RecipeInstructions";
import { RecipeCategories } from "@/components/recipe/RecipeCategories";
import { RecipeFormData } from "@/types/recipe";
import { Skeleton } from "@/components/ui/skeleton";
import { DietaryRestriction } from "@/types/dietary";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { adaptRecipeForDietaryRestrictions } from "@/services/recipeService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface EditRecipeFormProps {
  formData: RecipeFormData;
  setFormData: (updater: (prev: RecipeFormData) => RecipeFormData) => void;
  isSubmitting: boolean;
  isLoading: boolean;
  imagePreview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onAddIngredient: (e: React.FormEvent) => void;
  onRemoveIngredient: (index: number) => void;
  recipeId: string;
}

export const EditRecipeForm = ({
  formData,
  setFormData,
  isSubmitting,
  isLoading,
  imagePreview,
  handleImageChange,
  handleSubmit,
  onAddIngredient,
  onRemoveIngredient,
  recipeId
}: EditRecipeFormProps) => {
  const [isAdapting, setIsAdapting] = useState(false);
  const [selectedRestrictions, setSelectedRestrictions] = useState<DietaryRestriction[]>([]);
  const [adaptationError, setAdaptationError] = useState<string | null>(null);

  const dietaryOptions: { value: DietaryRestriction; label: string }[] = [
    { value: 'gluten-free', label: 'Gluten-Free' },
    { value: 'dairy-free', label: 'Dairy-Free' },
    { value: 'egg-free', label: 'Egg-Free' },
    { value: 'nut-free', label: 'Nut-Free' },
    { value: 'soy-free', label: 'Soy-Free' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' }
  ];

  const handleFieldChange = (field: keyof RecipeFormData, value: string | string[] | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleRestriction = (restriction: DietaryRestriction) => {
    setSelectedRestrictions(prev => 
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleAdaptRecipe = async () => {
    if (selectedRestrictions.length === 0) {
      toast.error("Please select at least one dietary restriction");
      return;
    }

    setIsAdapting(true);
    setAdaptationError(null);

    try {
      const adaptedRecipe = await adaptRecipeForDietaryRestrictions(recipeId, selectedRestrictions);
      
      if (!adaptedRecipe) {
        throw new Error("Failed to adapt recipe");
      }
      
      // Update form data with adapted recipe
      setFormData(prev => ({
        ...prev,
        title: adaptedRecipe.title || prev.title,
        ingredients: adaptedRecipe.ingredients || prev.ingredients,
        instructions: adaptedRecipe.instructions || prev.instructions,
      }));
      
      toast.success(`Recipe adapted for ${selectedRestrictions.join(', ')}`);
      
      // Show substitution information
      if (adaptedRecipe.substitutions && adaptedRecipe.substitutions.length > 0) {
        const substitutionInfo = adaptedRecipe.substitutions.map(
          (sub: any) => `• ${sub.original} → ${sub.substitute}: ${sub.reason}`
        ).join('\n');
        
        toast.info("Substitutions made", {
          description: substitutionInfo,
          duration: 8000,
        });
      }
    } catch (error) {
      console.error("Error adapting recipe:", error);
      setAdaptationError(error instanceof Error ? error.message : "Failed to adapt recipe");
      toast.error("Failed to adapt recipe");
    } finally {
      setIsAdapting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <RecipeDetails 
        formData={formData} 
        onChange={handleFieldChange} 
      />

      <RecipeImage
        onImageChange={handleImageChange}
        imagePreview={imagePreview}
        imageUrl={formData.imageUrl}
      />

      <div className="border p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Adapt Recipe for Dietary Restrictions</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select dietary restrictions and our AI will adapt this recipe with appropriate substitutions
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {dietaryOptions.map(option => (
            <div key={option.value} className="flex items-start space-x-2">
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
        
        <Button 
          type="button" 
          onClick={handleAdaptRecipe} 
          disabled={isAdapting || selectedRestrictions.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {isAdapting ? "Adapting Recipe..." : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Adapt Recipe with AI
            </>
          )}
        </Button>
        
        {adaptationError && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{adaptationError}</AlertDescription>
          </Alert>
        )}
      </div>

      <RecipeIngredients
        ingredients={formData.ingredients}
        currentIngredient={formData.currentIngredient}
        onIngredientChange={(value) => handleFieldChange('currentIngredient', value)}
        onAddIngredient={onAddIngredient}
        onRemoveIngredient={onRemoveIngredient}
      />

      <RecipeInstructions
        instructions={formData.instructions}
        onChange={(value) => handleFieldChange('instructions', value)}
      />

      <RecipeCategories 
        formData={formData}
        onChange={handleFieldChange}
      />

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Updating Recipe..." : "Update Recipe"}
      </Button>
    </form>
  );
};


import { Button } from "@/components/ui/button";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { RecipeIngredients } from "@/components/recipe/RecipeIngredients";
import { RecipeImport } from "@/components/recipe/RecipeImport";
import { RecipeDetails } from "@/components/recipe/RecipeDetails";
import { RecipeInstructions } from "@/components/recipe/RecipeInstructions";
import { RecipeCategories } from "@/components/recipe/RecipeCategories";
import { RecipeFormData } from "@/types/recipe";

interface AddRecipeFormProps {
  formData: RecipeFormData;
  setFormData: (updater: (prev: RecipeFormData) => RecipeFormData) => void;
  isSubmitting: boolean;
  imagePreview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isImporting: boolean;
  importError?: string;
  recipeUrl: string;
  onUrlChange: (url: string) => void;
  onImport: () => void;
  onAddIngredient: (e: React.FormEvent) => void;
  onRemoveIngredient: (index: number) => void;
}

export const AddRecipeForm = ({
  formData,
  setFormData,
  isSubmitting,
  imagePreview,
  handleImageChange,
  handleSubmit,
  isImporting,
  importError,
  recipeUrl,
  onUrlChange,
  onImport,
  onAddIngredient,
  onRemoveIngredient
}: AddRecipeFormProps) => {
  const handleFieldChange = (field: keyof RecipeFormData, value: string | string[] | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="add-recipe-form">
      <RecipeImport
        recipeUrl={recipeUrl}
        onUrlChange={onUrlChange}
        onImport={onImport}
        isImporting={isImporting}
        importError={importError}
      />

      <RecipeDetails 
        formData={formData} 
        onChange={handleFieldChange} 
      />

      <RecipeImage
        onImageChange={handleImageChange}
        imagePreview={imagePreview}
        imageUrl={formData.imageUrl}
      />

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
        {isSubmitting ? "Adding Recipe..." : "Add Recipe"}
      </Button>
    </form>
  );
};

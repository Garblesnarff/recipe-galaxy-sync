
import { Button } from "@/components/ui/button";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { RecipeIngredients } from "@/components/recipe/RecipeIngredients";
import { RecipeDetails } from "@/components/recipe/RecipeDetails";
import { RecipeInstructions } from "@/components/recipe/RecipeInstructions";
import { RecipeCategories } from "@/components/recipe/RecipeCategories";
import { RecipeFormData } from "@/types/recipe";
import { Skeleton } from "@/components/ui/skeleton";

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
  onRemoveIngredient
}: EditRecipeFormProps) => {
  const handleFieldChange = (field: keyof RecipeFormData, value: string | string[] | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

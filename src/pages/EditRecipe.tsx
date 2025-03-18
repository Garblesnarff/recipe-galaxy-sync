
import { useParams } from "react-router-dom";
import { useEditRecipeForm } from "@/hooks/useEditRecipeForm";
import { EditRecipeForm } from "@/components/recipe/EditRecipeForm";
import { RecipeFormLayout } from "@/components/layout/RecipeFormLayout";

export const EditRecipe = () => {
  const { id } = useParams<{ id: string }>();
  
  const {
    formData,
    setFormData,
    isSubmitting,
    isLoading,
    imagePreview,
    handleImageChange,
    handleSubmit,
    addIngredient,
    removeIngredient
  } = useEditRecipeForm(id || '');

  return (
    <RecipeFormLayout title="Edit Recipe" backUrl={`/recipe/${id}`}>
      <EditRecipeForm
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        isLoading={isLoading}
        imagePreview={imagePreview}
        handleImageChange={handleImageChange}
        handleSubmit={handleSubmit}
        onAddIngredient={addIngredient}
        onRemoveIngredient={removeIngredient}
      />
    </RecipeFormLayout>
  );
};

export default EditRecipe;

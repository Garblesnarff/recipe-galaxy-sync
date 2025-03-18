
import { useRecipeForm } from "@/hooks/useRecipeForm";
import { AddRecipeForm } from "@/components/recipe/AddRecipeForm";
import { RecipeFormLayout } from "@/components/layout/RecipeFormLayout";

export const AddRecipe = () => {
  const {
    formData,
    setFormData,
    isSubmitting,
    imagePreview,
    isImporting,
    recipeUrl,
    setRecipeUrl,
    handleImageChange,
    importRecipe,
    handleSubmit,
    addIngredient,
    removeIngredient
  } = useRecipeForm();

  return (
    <RecipeFormLayout title="Add New Recipe" backUrl="/">
      <AddRecipeForm
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        imagePreview={imagePreview}
        handleImageChange={handleImageChange}
        handleSubmit={handleSubmit}
        isImporting={isImporting}
        recipeUrl={recipeUrl}
        onUrlChange={setRecipeUrl}
        onImport={importRecipe}
        onAddIngredient={addIngredient}
        onRemoveIngredient={removeIngredient}
      />
    </RecipeFormLayout>
  );
};

export default AddRecipe;

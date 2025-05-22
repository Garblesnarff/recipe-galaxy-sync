
import { useRecipeForm } from "@/hooks/useRecipeForm";
import { AddRecipeForm } from "@/components/recipe/AddRecipeForm";
import { RecipeFormLayout } from "@/components/layout/RecipeFormLayout";
import { useAuthSession } from "@/hooks/useAuthSession";

export const AddRecipe = () => {
  const { userId } = useAuthSession();

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
  } = useRecipeForm(userId);

  return (
    <RecipeFormLayout title="Add New Recipe" backUrl="/">
      {/* override submit to inject userId */}
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

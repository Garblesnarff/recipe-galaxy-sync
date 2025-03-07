
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRecipeForm } from "@/hooks/useRecipeForm";
import { AddRecipeForm } from "@/components/recipe/AddRecipeForm";

export const AddRecipe = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold mb-6">Add New Recipe</h1>

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
        </div>
      </div>
    </div>
  );
};

export default AddRecipe;

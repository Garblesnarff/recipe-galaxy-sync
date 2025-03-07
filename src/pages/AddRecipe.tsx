
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
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Add New Recipe</h1>
        </div>
      </header>

      <div className="container py-6">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6 animate-fade-in">
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

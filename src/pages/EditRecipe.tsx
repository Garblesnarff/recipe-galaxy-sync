
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEditRecipeForm } from "@/hooks/useEditRecipeForm";
import { EditRecipeForm } from "@/components/recipe/EditRecipeForm";

export const EditRecipe = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(`/recipe/${id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Recipe</h1>
        </div>
      </header>

      <div className="container py-6">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6 animate-fade-in">
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
        </div>
      </div>
    </div>
  );
};

export default EditRecipe;

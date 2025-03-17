
import { useState, useEffect } from "react";
import { RecipeFormData } from "@/types/recipe";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { uploadImage, updateRecipe } from "@/services/recipeService";
import { supabase } from "@/integrations/supabase/client";

export const useEditRecipeForm = (recipeId: string) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<RecipeFormData>({
    title: "",
    description: "",
    cookTime: "",
    difficulty: "Easy",
    instructions: "",
    ingredients: [],
    currentIngredient: "",
    imageUrl: "",
    source_url: "",
    recipe_type: "manual",
    // Organization fields
    categories: [],
    cuisine_type: "Uncategorized",
    diet_tags: [],
    cooking_method: "Various",
    season_occasion: [],
    prep_time: "15 minutes",
    servings: 4
  });

  // Fetch recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("id", recipeId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          // Convert JSON ingredients array to string array if needed
          let ingredientsArray: string[] = [];
          if (Array.isArray(data.ingredients)) {
            ingredientsArray = data.ingredients.map(ing => 
              typeof ing === 'string' ? ing : String(ing)
            );
          }

          setFormData({
            title: data.title || "",
            description: data.description || "",
            cookTime: data.cook_time || "",
            difficulty: data.difficulty || "Easy",
            instructions: data.instructions || "",
            ingredients: ingredientsArray,
            currentIngredient: "",
            imageUrl: data.image_url || "",
            source_url: data.source_url || "",
            recipe_type: data.recipe_type || "manual",
            // Organization fields
            categories: data.categories || [],
            cuisine_type: data.cuisine_type || "Uncategorized",
            diet_tags: data.diet_tags || [],
            cooking_method: data.cooking_method || "Various",
            season_occasion: data.season_occasion || [],
            prep_time: data.prep_time || "15 minutes",
            servings: data.servings || 4
          });

          if (data.image_url) {
            setImagePreview(data.image_url);
          }
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
        toast.error("Failed to load recipe");
      } finally {
        setIsLoading(false);
      }
    };

    if (recipeId) {
      fetchRecipe();
    }
  }, [recipeId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Prepare the recipe data for updating
      const recipeToUpdate = {
        id: recipeId,
        title: formData.title,
        description: formData.description,
        cook_time: formData.cookTime,
        difficulty: formData.difficulty,
        instructions: formData.instructions,
        ingredients: formData.ingredients,
        recipe_type: formData.recipe_type,
        image_url: imageUrl,
        source_url: formData.source_url,
        // Organization fields
        categories: formData.categories,
        cuisine_type: formData.cuisine_type,
        diet_tags: formData.diet_tags,
        cooking_method: formData.cooking_method,
        season_occasion: formData.season_occasion,
        prep_time: formData.prep_time,
        servings: formData.servings
      };
      
      await updateRecipe(recipeToUpdate);
      toast.success("Recipe updated successfully!");
      navigate(`/recipe/${recipeId}`);
    } catch (error) {
      console.error("Error updating recipe:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update recipe");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.currentIngredient.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, prev.currentIngredient.trim()],
        currentIngredient: "",
      }));
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    isLoading,
    imageFile,
    imagePreview,
    handleImageChange,
    handleSubmit,
    addIngredient,
    removeIngredient
  };
};

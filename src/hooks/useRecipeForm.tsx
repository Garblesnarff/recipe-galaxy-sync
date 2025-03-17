
import { useState } from "react";
import { RecipeFormData } from "@/types/recipe";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { uploadImage, saveRecipe, importRecipeFromUrl, validateUrl } from "@/services/recipeService";

export const useRecipeForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [recipeUrl, setRecipeUrl] = useState("");
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
    // New organization fields
    categories: [],
    cuisine_type: "Uncategorized",
    diet_tags: [],
    cooking_method: "Various",
    season_occasion: [],
    prep_time: "15 minutes",
    servings: 4
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const importRecipe = async () => {
    if (!recipeUrl) {
      toast.error("Please enter a URL");
      return;
    }

    if (!validateUrl(recipeUrl)) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsImporting(true);
    try {
      console.log("Importing recipe from URL:", recipeUrl);
      const data = await importRecipeFromUrl(recipeUrl);
      
      // Parse ingredients if they came as a string
      let ingredientsArray: string[] = [];
      
      if (data.ingredients) {
        if (Array.isArray(data.ingredients)) {
          ingredientsArray = data.ingredients;
        } else if (typeof data.ingredients === 'string') {
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(data.ingredients);
            ingredientsArray = Array.isArray(parsed) ? parsed : [data.ingredients];
          } catch (e) {
            // If it can't be parsed as JSON, split by newlines or commas
            ingredientsArray = data.ingredients.split(/[,\n]+/).map(item => item.trim()).filter(Boolean);
          }
        }
      }
      
      // Determine recipe type based on URL - ensuring we use valid values for the database
      const recipeType = recipeUrl.includes('youtube.com') || recipeUrl.includes('youtu.be') 
        ? 'youtube' 
        : 'webpage';
      
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        cookTime: data.cook_time || prev.cookTime,
        difficulty: data.difficulty || prev.difficulty,
        instructions: data.instructions || prev.instructions,
        ingredients: ingredientsArray,
        imageUrl: data.image_url || prev.imageUrl,
        source_url: recipeUrl,
        recipe_type: recipeType
      }));

      if (data.image_url) {
        setImagePreview(data.image_url);
      }

      toast.success("Recipe imported successfully!");
    } catch (error) {
      console.error('Error importing recipe:', error);
      toast.error(error instanceof Error ? error.message : "Failed to import recipe. Please try again.");
    } finally {
      setIsImporting(false);
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

      // Prepare the recipe data for saving
      const recipeToSave = {
        title: formData.title,
        description: formData.description,
        cook_time: formData.cookTime,
        difficulty: formData.difficulty,
        instructions: formData.instructions,
        ingredients: formData.ingredients,
        recipe_type: formData.recipe_type,
        image_url: imageUrl,
        source_url: formData.source_url,
        // New organization fields
        categories: formData.categories,
        cuisine_type: formData.cuisine_type,
        diet_tags: formData.diet_tags,
        cooking_method: formData.cooking_method,
        season_occasion: formData.season_occasion,
        prep_time: formData.prep_time,
        servings: formData.servings,
        is_favorite: false
      };
      
      console.log("Saving recipe:", recipeToSave);
      
      await saveRecipe(recipeToSave);
      toast.success("Recipe added successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error adding recipe:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add recipe");
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
    imageFile,
    imagePreview,
    isImporting,
    recipeUrl,
    setRecipeUrl,
    handleImageChange,
    importRecipe,
    handleSubmit,
    addIngredient,
    removeIngredient
  };
};

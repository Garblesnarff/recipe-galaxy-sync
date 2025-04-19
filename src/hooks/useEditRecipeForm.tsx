import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateRecipe, uploadImage } from '@/services/recipe';
import { RecipeFormData } from '@/types/recipe';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useEditRecipeForm = (recipeId: string) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    cookTime: '',
    difficulty: 'Easy',
    instructions: '',
    ingredients: [],
    currentIngredient: '',
    imageUrl: '',
    source_url: '',
    recipe_type: 'manual',
    categories: [],
    cuisine_type: '',
    diet_tags: [],
    cooking_method: '',
    season_occasion: [],
    prep_time: '',
    servings: 2
  });

  useEffect(() => {
    if (recipeId) {
      loadRecipe(recipeId);
    }
  }, [recipeId]);

  const loadRecipe = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const ingredientsArray = data.ingredients ? 
          (Array.isArray(data.ingredients) 
            ? data.ingredients.map(item => typeof item === 'string' ? item : String(item))
            : [])
          : [];

        const validRecipeType = (data.source_type === 'manual' || 
                              data.source_type === 'webpage' || 
                              data.source_type === 'youtube') 
                              ? data.source_type as 'manual' | 'webpage' | 'youtube' 
                              : 'manual';

        setFormData({
          title: data.title || '',
          description: data.description || '',
          cookTime: data.cook_time || '',
          difficulty: data.difficulty || 'Easy',
          instructions: data.instructions || '',
          ingredients: ingredientsArray,
          currentIngredient: '',
          imageUrl: data.image_url || '',
          source_url: data.source_url || '',
          recipe_type: validRecipeType,
          categories: Array.isArray(data.categories) ? data.categories : [],
          cuisine_type: data.cuisine_type || '',
          diet_tags: Array.isArray(data.diet_tags) ? data.diet_tags : [],
          cooking_method: data.cooking_method || '',
          season_occasion: Array.isArray(data.season_occasion) ? data.season_occasion : [],
          prep_time: data.prep_time || '',
          servings: data.servings || 2
        });
      } else {
        toast.error("Recipe not found");
        navigate('/');
      }
    } catch (error) {
      console.error("Error fetching recipe:", error);
      toast.error("Failed to load recipe");
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      const imageUrl = await uploadImage(file);
      
      setFormData(prev => ({
        ...prev,
        imageUrl
      }));
    } catch (error) {
      console.error('Error handling image:', error);
      toast.error('Failed to upload image');
    }
  };

  const addIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.currentIngredient.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, prev.currentIngredient.trim()],
      currentIngredient: ''
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const recipeData = {
        title: formData.title,
        description: formData.description,
        source_url: formData.source_url,
        source_type: formData.recipe_type,
        prep_time: formData.prep_time,
        cook_time: formData.cookTime,
        servings: formData.servings,
        ingredients: formData.ingredients,
        instructions: formData.instructions,
        image_url: formData.imageUrl,
        difficulty: formData.difficulty,
        cuisine_type: formData.cuisine_type || null,
        cooking_method: formData.cooking_method || null,
        categories: formData.categories || [],
        diet_tags: formData.diet_tags || [],
        season_occasion: formData.season_occasion || []
      };
      
      console.log("Submitting updated recipe:", recipeData);
      
      const result = await updateRecipe(recipeId, recipeData);
      
      if (result) {
        navigate(`/recipe/${recipeId}`);
        toast.success("Recipe updated successfully!");
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      toast.error("Failed to update recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isLoading,
    isSubmitting,
    imagePreview,
    handleImageChange,
    handleSubmit,
    addIngredient,
    removeIngredient
  };
};

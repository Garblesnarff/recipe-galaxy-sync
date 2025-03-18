import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchRecipeById, updateRecipe } from '@/services/recipeService';
import { Recipe } from '@/types/recipe';
import { toast } from 'sonner';

interface FormData {
  title: string;
  description: string;
  sourceUrl: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: string[];
  instructions: string[];
  imageUrl: string;
  difficulty: string;
  notes: string;
  cuisineType: string | null;
  cookingMethod: string | null;
  categories: string[];
  dietTags: string[];
  seasonOccasion: string[];
}

export const useEditRecipeForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourceType, setSourceType] = useState<'url' | 'manual'>('url');

  useEffect(() => {
    if (id) {
      loadRecipe(id);
    }
  }, [id]);

  const loadRecipe = async (recipeId: string) => {
    setIsLoading(true);
    try {
      const data = await fetchRecipeById(recipeId);
      if (data) {
        setRecipe(data);
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

  const handleSubmit = async (data: FormData) => {
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      // Format data for Supabase
      const recipeData = {
        title: data.title,
        description: data.description,
        source_url: data.sourceUrl,
        source_type: sourceType,
        prep_time: data.prepTime,
        cook_time: data.cookTime,
        servings: data.servings,
        ingredients: data.ingredients,
        instructions: data.instructions,
        image_url: data.imageUrl,
        difficulty: data.difficulty,
        notes: data.notes,
        cuisine_type: data.cuisineType || null,
        cooking_method: data.cookingMethod || null,
        categories: data.categories || [],
        diet_tags: data.dietTags || [],
        season_occasion: data.seasonOccasion || []
      };
      
      console.log("Submitting updated recipe:", recipeData);
      
      // Update recipe in database
      const result = await updateRecipe(id, recipeData);
      
      if (result) {
        navigate(`/recipe/${id}`);
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
    recipe,
    isLoading,
    isSubmitting,
    handleSubmit,
    sourceType,
    setSourceType
  };
};

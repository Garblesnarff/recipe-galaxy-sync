
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface Rating {
  rating: number;
  timestamp: string;
}

export const useRecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userRating, setUserRating] = useState(0);
  const [currentServings, setCurrentServings] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Set initial state based on recipe data
      if (data) {
        setCurrentServings(data.servings || 4);
        setIsFavorite(data.is_favorite || false);
      }
      
      return data;
    },
  });

  const calculateAverageRating = (ratings: Rating[]) => {
    if (!ratings || !Array.isArray(ratings) || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    return Math.round(sum / ratings.length);
  };

  const rateMutation = useMutation({
    mutationFn: async ({ recipeId, rating }: { recipeId: string; rating: number }) => {
      const { data: existingRecipe, error: fetchError } = await supabase
        .from("recipes")
        .select("ratings")
        .eq("id", recipeId)
        .single();

      if (fetchError) throw fetchError;

      const currentRatings = (existingRecipe?.ratings as unknown as Rating[]) || [];

      const newRatings = [...currentRatings, { 
        rating, 
        timestamp: new Date().toISOString() 
      }] as unknown as Json;
      
      const { error: updateError } = await supabase
        .from("recipes")
        .update({ 
          ratings: newRatings,
          rating: calculateAverageRating([...currentRatings, { rating, timestamp: new Date().toISOString() }])
        })
        .eq("id", recipeId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe", id] });
      toast.success("Rating submitted successfully!");
    },
    onError: () => {
      toast.error("Failed to submit rating");
    },
  });
  
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ recipeId, isFavorite }: { recipeId: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("recipes")
        .update({ is_favorite: isFavorite })
        .eq("id", recipeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe", id] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast.success(isFavorite ? "Added to favorites" : "Removed from favorites");
    },
    onError: () => {
      // Revert the UI state if the mutation fails
      setIsFavorite(!isFavorite);
      toast.error("Failed to update favorite status");
    },
  });

  const navigateToEdit = () => {
    if (recipe) {
      navigate(`/edit-recipe/${recipe.id}`);
    }
  };
  
  const handleToggleFavorite = () => {
    if (!recipe) return;
    
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    toggleFavoriteMutation.mutate({ 
      recipeId: recipe.id, 
      isFavorite: newFavoriteState 
    });
  };

  const handleRating = () => {
    const rating = 5; // Example hardcoded rating
    setUserRating(rating);
    rateMutation.mutate({ recipeId: recipe?.id || "", rating });
  };

  return {
    recipe,
    isLoading,
    navigateToEdit,
    isFavorite,
    handleToggleFavorite,
    handleRating,
    currentServings,
    setCurrentServings,
    userRating,
    navigate
  };
};

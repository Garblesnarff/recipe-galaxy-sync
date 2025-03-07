
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RecipeHeader } from "@/components/recipe/RecipeHeader";
import { RecipeMetadata } from "@/components/recipe/RecipeMetadata";
import { RecipeIngredientsList } from "@/components/recipe/RecipeIngredientsList";
import { RecipeInstructionsList } from "@/components/recipe/RecipeInstructionsList";
import { RecipeActions } from "@/components/recipe/RecipeActions";

interface Rating {
  rating: number;
  timestamp: string;
}

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userRating, setUserRating] = useState(0);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
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

      // Ensure ratings is an array and properly typed
      const currentRatings = (existingRecipe?.ratings as unknown as Rating[]) || [];

      const newRatings = [...currentRatings, { 
        rating, 
        timestamp: new Date().toISOString() 
      }] as unknown as Json;
      
      const { error: updateError } = await supabase
        .from("recipes")
        .update({ 
          ratings: newRatings,
          rating: calculateAverageRating(currentRatings)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="text-center py-20">Loading recipe...</div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="text-center py-20">Recipe not found</div>
          <Button 
            variant="app" 
            onClick={() => navigate("/")} 
            className="mx-auto mt-4"
          >
            Back to Recipes
          </Button>
        </div>
      </div>
    );
  }

  const handleRating = () => {
    // Here you would open a rating dialog or implement rating UI
    const rating = 5; // Example hardcoded rating
    setUserRating(rating);
    rateMutation.mutate({ recipeId: recipe.id, rating });
  };

  // Cast ratings to Rating[] type through unknown
  const ratingsArray = (recipe.ratings as unknown as Rating[]) || [];

  return (
    <div className="min-h-screen bg-background">
      <RecipeHeader 
        title={recipe.title}
        imageUrl={recipe.image_url}
        rating={recipe.rating}
        ratingsCount={ratingsArray.length}
      />

      <div className="container">
        <div className="bg-white px-6 pb-6 pt-0 shadow-sm">
          <RecipeMetadata 
            cookTime={recipe.cook_time}
            difficulty={recipe.difficulty}
            description={recipe.description}
          />

          <RecipeIngredientsList 
            ingredients={recipe.ingredients as string[]}
          />

          <RecipeInstructionsList 
            instructions={recipe.instructions}
          />

          <RecipeActions 
            ingredients={recipe.ingredients as string[]}
            recipeId={recipe.id}
            onRateClick={handleRating}
          />
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;


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
import { Edit, Heart } from "lucide-react";

interface Rating {
  rating: number;
  timestamp: string;
}

const RecipeDetail = () => {
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
    const rating = 5; // Example hardcoded rating
    setUserRating(rating);
    rateMutation.mutate({ recipeId: recipe.id, rating });
  };

  const ratingsArray = (recipe.ratings as unknown as Rating[]) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <RecipeHeader 
        title={recipe.title}
        imageUrl={recipe.image_url}
        rating={recipe.rating}
        ratingsCount={ratingsArray.length}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

      <div className="container">
        <div className="bg-white px-6 pb-6 pt-0 shadow-sm">
          <div className="flex justify-end -mt-4 mb-4">
            <Button 
              onClick={navigateToEdit}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              Edit Recipe
            </Button>
          </div>

          <RecipeMetadata 
            cookTime={recipe.cook_time}
            prepTime={recipe.prep_time}
            difficulty={recipe.difficulty}
            description={recipe.description}
            servings={recipe.servings}
            date={recipe.created_at}
          />

          {(recipe.categories?.length > 0 || recipe.diet_tags?.length > 0 || recipe.cuisine_type) && (
            <div className="mt-4 mb-6">
              <h3 className="text-lg font-medium mb-2">Categories & Tags</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.cuisine_type && recipe.cuisine_type !== "Uncategorized" && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {recipe.cuisine_type}
                  </span>
                )}
                
                {recipe.categories?.map((category, index) => (
                  <span key={`category-${index}`} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {category}
                  </span>
                ))}
                
                {recipe.diet_tags?.map((tag, index) => (
                  <span key={`diet-${index}`} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
                
                {recipe.season_occasion?.map((season, index) => (
                  <span key={`season-${index}`} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                    {season}
                  </span>
                ))}
                
                {recipe.cooking_method && recipe.cooking_method !== "Various" && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    {recipe.cooking_method}
                  </span>
                )}
              </div>
            </div>
          )}

          {recipe.source_url && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Source</h3>
              <a 
                href={recipe.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {recipe.source_url}
              </a>
            </div>
          )}

          <RecipeIngredientsList 
            ingredients={recipe.ingredients as string[]}
            servings={currentServings}
            originalServings={recipe.servings}
          />

          <RecipeInstructionsList 
            instructions={recipe.instructions}
          />

          <RecipeActions 
            ingredients={recipe.ingredients as string[]}
            recipeId={recipe.id}
            onRateClick={handleRating}
            servings={currentServings}
            onServingsChange={setCurrentServings}
          />
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;

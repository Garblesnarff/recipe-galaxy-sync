
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { Clock, ArrowLeft, ChefHat, ShoppingCart, Check, Star } from "lucide-react";
import { toast } from "sonner";

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

  const handleRating = (value: number) => {
    setUserRating(value);
    rateMutation.mutate({ recipeId: recipe.id, rating: value });
  };

  // Cast ratings to Rating[] type through unknown
  const ratingsArray = (recipe.ratings as unknown as Rating[]) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {recipe.image_url ? (
          <div className="h-64 md:h-80 relative">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="h-32 bg-gray-200" />
        )}

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full z-10"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5 text-black" />
        </Button>

        <div className="container -mt-16 relative z-10">
          <div className="bg-white rounded-t-3xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold mb-2">{recipe.title}</h1>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-sm font-medium">{recipe.rating || '0'}</span>
              </div>
              <span className="text-sm text-gray-500">
                ({ratingsArray.length} ratings)
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              {recipe.cook_time && (
                <div className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
                  <Clock className="mr-1 h-4 w-4 text-gray-500" />
                  <span>{recipe.cook_time}</span>
                </div>
              )}
              {recipe.difficulty && (
                <div className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
                  <ChefHat className="mr-1 h-4 w-4 text-gray-500" />
                  <span>{recipe.difficulty}</span>
                </div>
              )}
            </div>

            <p className="text-gray-700 mb-6">{recipe.description}</p>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Ingredients</h2>
              <ul className="space-y-2">
                {(recipe.ingredients as string[]).map((ingredient, index) => (
                  <li key={index} className="flex items-center">
                    <div className="checkbox-circle mr-3">
                      <Check className="h-3 w-3 opacity-0 transition-opacity" />
                    </div>
                    <span className="text-gray-800">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Instructions</h2>
              <div className="prose max-w-none">
                {recipe.instructions.split("\n").map((instruction, index) => (
                  instruction.trim() && (
                    <div key={index} className="flex mb-4">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-7 h-7 rounded-full bg-recipe-green-light flex items-center justify-center text-sm font-medium text-recipe-green-dark">
                          {index + 1}
                        </div>
                      </div>
                      <p className="text-gray-700">{instruction}</p>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to grocery list
              </Button>
              <Button variant="app" className="flex-1">
                Rate Recipe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;

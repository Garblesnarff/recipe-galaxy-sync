
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { ArrowLeft } from "lucide-react";
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

      // Ensure ratings is an array
      const currentRatings = Array.isArray(existingRecipe?.ratings) 
        ? existingRecipe.ratings as Rating[]
        : [];

      const newRatings = [...currentRatings, { 
        rating, 
        timestamp: new Date().toISOString() 
      }];
      
      const { error: updateError } = await supabase
        .from("recipes")
        .update({ 
          ratings: newRatings,
          rating: calculateAverageRating(newRatings)
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
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <div className="text-center">Loading recipe...</div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <div className="text-center">Recipe not found</div>
          <Button onClick={() => navigate("/")} className="mt-4">
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

  // Ensure ratings is treated as an array
  const ratingsArray = Array.isArray(recipe.ratings) ? recipe.ratings as Rating[] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
          {recipe.image_url && (
            <div className="aspect-video relative">
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl font-semibold">{recipe.title}</h1>
              <div className="flex flex-col items-end">
                <Rating
                  value={userRating || recipe.rating || 0}
                  onChange={handleRating}
                  className="mb-1"
                />
                <span className="text-sm text-gray-500">
                  {ratingsArray.length} ratings
                </span>
              </div>
            </div>

            <div className="flex gap-4 text-sm text-gray-600 mb-6">
              {recipe.cook_time && (
                <div>Cook time: {recipe.cook_time}</div>
              )}
              {recipe.difficulty && (
                <div>Difficulty: {recipe.difficulty}</div>
              )}
            </div>

            <p className="text-gray-600 mb-8">{recipe.description}</p>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
              <ul className="list-disc pl-5 space-y-2">
                {(recipe.ingredients as string[]).map((ingredient, index) => (
                  <li key={index} className="text-gray-600">{ingredient}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              <div className="prose max-w-none">
                {recipe.instructions.split("\n").map((instruction, index) => (
                  instruction.trim() && (
                    <p key={index} className="mb-4 text-gray-600">
                      {instruction}
                    </p>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;

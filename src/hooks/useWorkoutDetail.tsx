
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWorkoutDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: workout, isLoading } = useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      if (!id) throw new Error("Workout ID is required");

      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          exercises:workout_exercises(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Set initial state based on workout data
      if (data) {
        setIsFavorite(data.is_favorite || false);
      }

      return data;
    },
    enabled: !!id,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ workoutId, isFavorite }: { workoutId: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("workouts")
        .update({ is_favorite: isFavorite })
        .eq("id", workoutId);

      if (error) throw error;
    },
    onSuccess: () => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["workout", id] });
        queryClient.invalidateQueries({ queryKey: ["workouts"] });
      }
      toast.success(isFavorite ? "Added to favorites" : "Removed from favorites");
    },
    onError: () => {
      setIsFavorite(!isFavorite);
      toast.error("Failed to update favorite status");
    },
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      toast.success("Workout deleted successfully");
      navigate("/workouts");
    },
    onError: () => {
      toast.error("Failed to delete workout");
    },
  });

  const handleToggleFavorite = () => {
    if (!workout || !workout.id) return;

    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    toggleFavoriteMutation.mutate({
      workoutId: workout.id,
      isFavorite: newFavoriteState
    });
  };

  const handleDeleteWorkout = () => {
    if (!workout || !workout.id) return;
    deleteWorkoutMutation.mutate(workout.id);
  };

  const navigateToEdit = () => {
    if (workout && workout.id) {
      navigate(`/workouts/edit/${workout.id}`);
    }
  };

  return {
    workout,
    isLoading,
    isFavorite,
    handleToggleFavorite,
    handleDeleteWorkout,
    navigateToEdit,
    navigate,
    isDeleting: deleteWorkoutMutation.isPending,
  };
};

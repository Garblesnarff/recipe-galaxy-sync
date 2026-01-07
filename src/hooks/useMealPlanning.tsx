/**
 * useMealPlanning Hook
 * Custom hook for managing meal planning state and operations
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMealPlans,
  getMealPlanWithRecipes,
  createMealPlan as createMealPlanService,
  addRecipeToMealPlan,
  removeRecipeFromMealPlan,
  updateMealPlanRecipe,
  duplicateMealPlan,
  deleteMealPlan,
  CreateMealPlanData,
  AddRecipeToMealPlanData
} from "@/services/mealPlanningService";
import { MealPlan, MealPlanRecipe } from "@/types/mealPlanning";
import { toast } from "sonner";

export const useMealPlanning = (mealPlanId?: string) => {
  const queryClient = useQueryClient();
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(mealPlanId || null);

  // Fetch all meal plans for the user
  const {
    data: mealPlans = [],
    isLoading: isLoadingPlans,
    refetch: refetchPlans
  } = useQuery({
    queryKey: ["mealPlans"],
    queryFn: async () => {
      // For now, simulate user ID - in real app get from auth context
      const userId = 'current-user-id';
      return await getMealPlans(userId);
    },
  });

  // Fetch current meal plan with recipes
  const {
    data: currentPlan,
    isLoading: isLoadingCurrentPlan,
    refetch: refetchCurrentPlan
  } = useQuery({
    queryKey: ["mealPlan", currentPlanId],
    queryFn: async () => {
      if (!currentPlanId) return null;
      // For now, simulate user ID - in real app get from auth context
      const userId = 'current-user-id';
      return await getMealPlanWithRecipes(currentPlanId, userId);
    },
    enabled: !!currentPlanId,
  });

  // Create meal plan mutation
  const createMealPlanMutation = useMutation({
    mutationFn: async (data: CreateMealPlanData) => {
      // For now, simulate user ID - in real app get from auth context
      const userId = 'current-user-id';
      return await createMealPlanService(userId, data);
    },
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      setCurrentPlanId(newPlan.id);
      toast.success("Meal plan created successfully!");
    },
    onError: (error) => {
      console.error('Error creating meal plan:', error);
      toast.error("Failed to create meal plan");
    },
  });

  // Add recipe to meal plan mutation
  const addRecipeMutation = useMutation({
    mutationFn: async ({ mealPlanId, recipeData }: { mealPlanId: string; recipeData: AddRecipeToMealPlanData }) => {
      // For now, simulate user ID - in real app get from auth context
      const userId = 'current-user-id';
      return await addRecipeToMealPlan(mealPlanId, userId, recipeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlan", currentPlanId] });
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      toast.success("Recipe added to meal plan!");
    },
    onError: (error) => {
      console.error('Error adding recipe to meal plan:', error);
      toast.error("Failed to add recipe to meal plan");
    },
  });

  // Remove recipe from meal plan mutation
  const removeRecipeMutation = useMutation({
    mutationFn: async (mealPlanRecipeId: string) => {
      // For now, simulate user ID - in real app get from auth context
      const userId = 'current-user-id';
      return await removeRecipeFromMealPlan(mealPlanRecipeId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlan", currentPlanId] });
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      toast.success("Recipe removed from meal plan");
    },
    onError: (error) => {
      console.error('Error removing recipe from meal plan:', error);
      toast.error("Failed to remove recipe from meal plan");
    },
  });

  // Update meal plan recipe mutation
  const updateRecipeMutation = useMutation({
    mutationFn: async ({ recipeId, updates }: { recipeId: string; updates: Partial<MealPlanRecipe> }) => {
      // For now, simulate user ID - in real app get from auth context
      const userId = 'current-user-id';
      return await updateMealPlanRecipe(recipeId, userId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlan", currentPlanId] });
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      toast.success("Recipe updated in meal plan");
    },
    onError: (error) => {
      console.error('Error updating recipe in meal plan:', error);
      toast.error("Failed to update recipe in meal plan");
    },
  });

  // Delete meal plan mutation
  const deleteMealPlanMutation = useMutation({
    mutationFn: async (mealPlanId: string) => {
      // For now, simulate user ID - in real app get from auth context
      const userId = 'current-user-id';
      return await deleteMealPlan(mealPlanId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      if (currentPlanId) {
        setCurrentPlanId(null);
      }
      toast.success("Meal plan deleted successfully");
    },
    onError: (error) => {
      console.error('Error deleting meal plan:', error);
      toast.error("Failed to delete meal plan");
    },
  });

  // Select a meal plan
  const selectMealPlan = useCallback((planId: string) => {
    setCurrentPlanId(planId);
  }, []);

  // Create a new meal plan
  const createMealPlan = useCallback(async (data: CreateMealPlanData) => {
    return await createMealPlanMutation.mutateAsync(data);
  }, [createMealPlanMutation]);

  // Add recipe to current meal plan
  const addRecipeToCurrentPlan = useCallback(async (recipeData: AddRecipeToMealPlanData) => {
    if (!currentPlanId) {
      throw new Error("No meal plan selected");
    }
    return await addRecipeMutation.mutateAsync({
      mealPlanId: currentPlanId,
      recipeData
    });
  }, [currentPlanId, addRecipeMutation]);

  // Remove recipe from current meal plan
  const removeRecipeFromCurrentPlan = useCallback(async (mealPlanRecipeId: string) => {
    return await removeRecipeMutation.mutateAsync(mealPlanRecipeId);
  }, [removeRecipeMutation]);

  // Update recipe in current meal plan
  const updateRecipeInCurrentPlan = useCallback(async (recipeId: string, updates: Partial<MealPlanRecipe>) => {
    return await updateRecipeMutation.mutateAsync({ recipeId, updates });
  }, [updateRecipeMutation]);

  // Delete current meal plan
  const deleteCurrentPlan = useCallback(async () => {
    if (!currentPlanId) {
      throw new Error("No meal plan selected");
    }
    return await deleteMealPlanMutation.mutateAsync(currentPlanId);
  }, [currentPlanId, deleteMealPlanMutation]);

  // Refresh all data
  const refreshMealPlans = useCallback(() => {
    refetchPlans();
    if (currentPlanId) {
      refetchCurrentPlan();
    }
  }, [refetchPlans, refetchCurrentPlan, currentPlanId]);

  return {
    // Data
    mealPlans,
    currentPlan,
    currentPlanId,

    // Loading states
    isLoading: isLoadingPlans || isLoadingCurrentPlan,
    isCreating: createMealPlanMutation.isPending,
    isAddingRecipe: addRecipeMutation.isPending,
    isRemovingRecipe: removeRecipeMutation.isPending,
    isUpdatingRecipe: updateRecipeMutation.isPending,
    isDeleting: deleteMealPlanMutation.isPending,

    // Actions
    selectMealPlan,
    createMealPlan,
    addRecipeToCurrentPlan,
    removeRecipeFromCurrentPlan,
    updateRecipeInCurrentPlan,
    deleteCurrentPlan,
    refreshMealPlans,
  };
};

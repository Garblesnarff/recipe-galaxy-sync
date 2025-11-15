
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWorkoutTemplates = (userId: string | null) => {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["workout-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          exercises:workout_exercises(*)
        `)
        .eq("is_template", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const cloneTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!userId) throw new Error("User must be logged in to clone templates");

      // Fetch the template
      const { data: template, error: fetchError } = await supabase
        .from("workouts")
        .select(`
          *,
          exercises:workout_exercises(*)
        `)
        .eq("id", templateId)
        .single();

      if (fetchError) throw fetchError;

      // Create new workout from template
      const { id, created_at, updated_at, exercises, ...templateData } = template;

      const { data: newWorkout, error: createError } = await supabase
        .from("workouts")
        .insert({
          ...templateData,
          user_id: userId,
          is_template: false,
          title: `${templateData.title} (Copy)`,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Clone exercises
      if (exercises && exercises.length > 0) {
        const exercisePayload = exercises.map((ex: any) => {
          const { id, workout_id, created_at, ...exerciseData } = ex;
          return {
            ...exerciseData,
            workout_id: newWorkout.id,
          };
        });

        const { error: exercisesError } = await supabase
          .from("workout_exercises")
          .insert(exercisePayload);

        if (exercisesError) throw exercisesError;
      }

      return newWorkout;
    },
    onSuccess: (newWorkout) => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      toast.success("Template cloned successfully!");
      return newWorkout;
    },
    onError: (error) => {
      console.error("Error cloning template:", error);
      toast.error(error instanceof Error ? error.message : "Failed to clone template");
    },
  });

  return {
    templates: templates || [],
    isLoading,
    cloneTemplate: cloneTemplateMutation.mutate,
    cloneTemplateAsync: cloneTemplateMutation.mutateAsync,
    isCloning: cloneTemplateMutation.isPending,
  };
};

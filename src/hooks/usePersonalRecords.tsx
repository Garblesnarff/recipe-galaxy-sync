import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "./useAuthSession";
import {
  getPersonalRecords,
  getExercisePRs,
  deletePersonalRecord,
} from "@/services/workout";
import type { PersonalRecord } from "@/types/workout";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to fetch all personal records for the authenticated user
 */
export const usePersonalRecords = () => {
  const { session } = useAuthSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["personalRecords", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      return getPersonalRecords(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch personal records for a specific exercise
 */
export const useExercisePRs = (exerciseName: string) => {
  const { session } = useAuthSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["exercisePRs", userId, exerciseName],
    queryFn: () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      return getExercisePRs(userId, exerciseName);
    },
    enabled: !!userId && !!exerciseName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to delete a personal record
 */
export const useDeletePersonalRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePersonalRecord,
    onSuccess: () => {
      // Invalidate all PR queries to refetch
      queryClient.invalidateQueries({ queryKey: ["personalRecords"] });
      queryClient.invalidateQueries({ queryKey: ["exercisePRs"] });

      toast({
        title: "Personal Record Deleted",
        description: "The record has been removed successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting personal record:", error);
      toast({
        title: "Error",
        description: "Failed to delete the personal record. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to get grouped personal records by exercise
 * Returns PRs organized by exercise name with all record types
 */
export const useGroupedPersonalRecords = () => {
  const { data: records = [], isLoading, error } = usePersonalRecords();

  const groupedRecords = records.reduce((acc, record) => {
    const exerciseName = record.exercise_name;

    if (!acc[exerciseName]) {
      acc[exerciseName] = {
        exerciseName,
        records: [],
        maxWeight: undefined,
        maxReps: undefined,
        maxDuration: undefined,
      };
    }

    acc[exerciseName].records.push(record);

    // Set specific record types
    if (record.record_type === "max_weight") {
      acc[exerciseName].maxWeight = record;
    } else if (record.record_type === "max_reps") {
      acc[exerciseName].maxReps = record;
    } else if (record.record_type === "max_duration") {
      acc[exerciseName].maxDuration = record;
    }

    return acc;
  }, {} as Record<string, {
    exerciseName: string;
    records: PersonalRecord[];
    maxWeight?: PersonalRecord;
    maxReps?: PersonalRecord;
    maxDuration?: PersonalRecord;
  }>);

  return {
    groupedRecords,
    isLoading,
    error,
  };
};

/**
 * Hook to invalidate personal records cache
 * Useful after logging a workout to refresh PRs
 */
export const useInvalidatePersonalRecords = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["personalRecords"] });
    queryClient.invalidateQueries({ queryKey: ["exercisePRs"] });
  };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  createSchedule,
  getScheduledWorkouts,
  getAllSchedules,
  getUpcomingWorkouts,
  updateSchedule,
  deleteSchedule,
  toggleScheduleActive,
  CreateScheduleData,
  UpdateScheduleData,
} from "@/services/workout/workoutSchedule";

/**
 * Hook for fetching all workout schedules
 */
export const useWorkoutSchedules = (userId: string) => {
  return useQuery({
    queryKey: ["workout-schedules", userId],
    queryFn: () => getAllSchedules(userId),
    enabled: !!userId,
  });
};

/**
 * Hook for fetching scheduled workouts for a specific date
 */
export const useScheduledWorkouts = (userId: string, date?: Date) => {
  return useQuery({
    queryKey: ["scheduled-workouts", userId, date?.toISOString()],
    queryFn: () => getScheduledWorkouts(userId, date),
    enabled: !!userId,
  });
};

/**
 * Hook for fetching upcoming workouts
 */
export const useUpcomingWorkouts = (userId: string, days: number = 7) => {
  return useQuery({
    queryKey: ["upcoming-workouts", userId, days],
    queryFn: () => getUpcomingWorkouts(userId, days),
    enabled: !!userId,
    refetchInterval: 60000, // Refetch every minute to keep upcoming workouts fresh
  });
};

/**
 * Hook for creating a new workout schedule
 */
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      scheduleData,
    }: {
      userId: string;
      scheduleData: CreateScheduleData;
    }) => {
      return await createSchedule(userId, scheduleData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workout-schedules", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-workouts", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-workouts", variables.userId] });
      toast({
        title: "Success",
        description: "Workout scheduled successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating schedule:", error);
      toast({
        title: "Error",
        description: "Failed to schedule workout. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for updating a workout schedule
 */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      scheduleId,
      updates,
      userId,
    }: {
      scheduleId: string;
      updates: UpdateScheduleData;
      userId: string;
    }) => {
      return await updateSchedule(scheduleId, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workout-schedules", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-workouts", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-workouts", variables.userId] });
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for deleting a workout schedule
 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      scheduleId,
      userId,
    }: {
      scheduleId: string;
      userId: string;
    }) => {
      return await deleteSchedule(scheduleId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workout-schedules", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-workouts", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-workouts", variables.userId] });
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error",
        description: "Failed to delete schedule. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for toggling schedule active status
 */
export const useToggleScheduleActive = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      scheduleId,
      isActive,
      userId,
    }: {
      scheduleId: string;
      isActive: boolean;
      userId: string;
    }) => {
      return await toggleScheduleActive(scheduleId, isActive);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workout-schedules", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-workouts", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-workouts", variables.userId] });
      toast({
        title: "Success",
        description: variables.isActive
          ? "Schedule activated"
          : "Schedule paused",
      });
    },
    onError: (error) => {
      console.error("Error toggling schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to get the current user's ID
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });
};

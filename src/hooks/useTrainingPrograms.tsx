import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getTrainingPrograms,
  getProgramDetail,
  getUserEnrollments,
  getActiveEnrollments,
  enrollInProgram,
  getCurrentWeekWorkouts,
  markWorkoutComplete,
  getProgramProgress,
  advanceToNextWeek,
  type ProgramFilters,
} from "@/services/workout/trainingPrograms";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for fetching training programs with optional filters
 */
export const useTrainingPrograms = (filters?: ProgramFilters) => {
  return useQuery({
    queryKey: ["training-programs", filters],
    queryFn: () => getTrainingPrograms(filters),
  });
};

/**
 * Hook for fetching a single program's details
 */
export const useProgramDetail = (programId: string | undefined) => {
  return useQuery({
    queryKey: ["program-detail", programId],
    queryFn: () => getProgramDetail(programId!),
    enabled: !!programId,
  });
};

/**
 * Hook for fetching user's program enrollments
 */
export const useUserEnrollments = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  return useQuery({
    queryKey: ["user-enrollments", userId],
    queryFn: () => getUserEnrollments(userId!),
    enabled: !!userId,
  });
};

/**
 * Hook for fetching user's active (non-completed) enrollments
 */
export const useActiveEnrollments = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  return useQuery({
    queryKey: ["active-enrollments", userId],
    queryFn: () => getActiveEnrollments(userId!),
    enabled: !!userId,
  });
};

/**
 * Hook for getting current week's workouts for an enrollment
 */
export const useCurrentWeekWorkouts = (enrollmentId: string | undefined) => {
  return useQuery({
    queryKey: ["current-week-workouts", enrollmentId],
    queryFn: () => getCurrentWeekWorkouts(enrollmentId!),
    enabled: !!enrollmentId,
  });
};

/**
 * Hook for getting program progress
 */
export const useProgramProgress = (enrollmentId: string | undefined) => {
  return useQuery({
    queryKey: ["program-progress", enrollmentId],
    queryFn: () => getProgramProgress(enrollmentId!),
    enabled: !!enrollmentId,
  });
};

/**
 * Hook for enrolling in a program
 */
export const useEnrollInProgram = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ programId }: { programId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      return enrollInProgram(user.id, programId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["active-enrollments"] });
      toast({
        title: "Enrolled Successfully!",
        description: "You've successfully enrolled in the program.",
      });
    },
    onError: (error) => {
      console.error("Error enrolling in program:", error);
      toast({
        title: "Enrollment Failed",
        description: "There was an error enrolling in this program. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for marking a workout as complete
 */
export const useMarkWorkoutComplete = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      programWorkoutId,
      workoutLogId,
    }: {
      enrollmentId: string;
      programWorkoutId: string;
      workoutLogId?: string;
    }) => markWorkoutComplete(enrollmentId, programWorkoutId, workoutLogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-detail"] });
      queryClient.invalidateQueries({ queryKey: ["program-progress"] });
      queryClient.invalidateQueries({ queryKey: ["current-week-workouts"] });
      toast({
        title: "Workout Completed!",
        description: "Great job! Keep up the momentum.",
      });
    },
    onError: (error) => {
      console.error("Error completing workout:", error);
      toast({
        title: "Error",
        description: "Failed to mark workout as complete. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for advancing to the next week
 */
export const useAdvanceToNextWeek = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (enrollmentId: string) => advanceToNextWeek(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["active-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["program-progress"] });
      queryClient.invalidateQueries({ queryKey: ["current-week-workouts"] });
      toast({
        title: "Week Completed!",
        description: "Moving on to the next week. Keep crushing it!",
      });
    },
    onError: (error) => {
      console.error("Error advancing week:", error);
      toast({
        title: "Error",
        description: "Failed to advance to next week. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Comprehensive hook that combines program data with enrollment status
 */
export const useProgramWithEnrollment = (programId: string | undefined) => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const { data: program, isLoading: programLoading } = useProgramDetail(programId);

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["user-enrollments", userId],
    queryFn: () => getUserEnrollments(userId!),
    enabled: !!userId,
  });

  const enrollment = enrollments?.find(
    (e) => e.program_id === programId && !e.completed
  );

  const { data: progress, isLoading: progressLoading } = useProgramProgress(
    enrollment?.id
  );

  return {
    program,
    enrollment,
    progress,
    isLoading: programLoading || enrollmentsLoading || progressLoading,
    isEnrolled: !!enrollment,
  };
};

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  calculateRecoveryScore,
  getRecoveryHistory,
  getRestDays,
  logRestDay,
  suggestRestDay,
  RestDayData,
  RecoveryScore,
  RestDay,
} from "@/services/workout/recovery";

export const useRecovery = (days: number = 30) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoggingRest, setIsLoggingRest] = useState(false);

  // Fetch recovery score for today
  const {
    data: recoveryScore,
    isLoading: isLoadingScore,
    error: scoreError,
    refetch: refetchScore,
  } = useQuery<RecoveryScore | null>({
    queryKey: ["recoveryScore", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        return await calculateRecoveryScore(user.id);
      } catch (error) {
        console.error("Error fetching recovery score:", error);
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch recovery history
  const {
    data: recoveryHistory,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<RecoveryScore[]>({
    queryKey: ["recoveryHistory", user?.id, days],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getRecoveryHistory(user.id, days);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch rest days
  const {
    data: restDays,
    isLoading: isLoadingRestDays,
    error: restDaysError,
    refetch: refetchRestDays,
  } = useQuery<RestDay[]>({
    queryKey: ["restDays", user?.id, days],
    queryFn: async () => {
      if (!user?.id) return [];
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      return await getRestDays(
        user.id,
        startDate.toISOString().split("T")[0],
        endDate
      );
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch rest day suggestion
  const {
    data: restSuggestion,
    isLoading: isLoadingSuggestion,
    error: suggestionError,
    refetch: refetchSuggestion,
  } = useQuery({
    queryKey: ["restSuggestion", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await suggestRestDay(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Mutation for logging rest day
  const logRestDayMutation = useMutation({
    mutationFn: async (data: RestDayData) => {
      if (!user?.id) throw new Error("User not authenticated");
      return await logRestDay(user.id, data);
    },
    onSuccess: () => {
      toast.success("Rest day logged successfully!");
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["recoveryScore", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["recoveryHistory", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["restDays", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["restSuggestion", user?.id] });
      setIsLoggingRest(false);
    },
    onError: (error: any) => {
      console.error("Error logging rest day:", error);
      if (error?.message?.includes("duplicate")) {
        toast.error("Rest day already logged for this date. Please update instead.");
      } else {
        toast.error("Failed to log rest day. Please try again.");
      }
      setIsLoggingRest(false);
    },
  });

  // Refresh all recovery data
  const refreshAll = async () => {
    await Promise.all([
      refetchScore(),
      refetchHistory(),
      refetchRestDays(),
      refetchSuggestion(),
    ]);
  };

  // Log rest day handler
  const handleLogRestDay = async (data: RestDayData) => {
    setIsLoggingRest(true);
    await logRestDayMutation.mutateAsync(data);
  };

  return {
    // Data
    recoveryScore,
    recoveryHistory: recoveryHistory || [],
    restDays: restDays || [],
    restSuggestion,

    // Loading states
    isLoading:
      isLoadingScore ||
      isLoadingHistory ||
      isLoadingRestDays ||
      isLoadingSuggestion,
    isLoadingScore,
    isLoadingHistory,
    isLoadingRestDays,
    isLoadingSuggestion,
    isLoggingRest,

    // Errors
    error: scoreError || historyError || restDaysError || suggestionError,
    scoreError,
    historyError,
    restDaysError,
    suggestionError,

    // Actions
    logRestDay: handleLogRestDay,
    refreshAll,
    refetchScore,
    refetchHistory,
    refetchRestDays,
    refetchSuggestion,
  };
};

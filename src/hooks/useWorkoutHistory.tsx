
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWorkoutHistory = (userId: string | null) => {
  const { data: workoutLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["workout-history", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("workout_logs")
        .select(`
          *,
          workout:workouts(*),
          exercises:workout_log_exercises(*)
        `)
        .eq("user_id", userId)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["workout-stats", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: logs, error } = await supabase
        .from("workout_logs")
        .select("completed_at, duration_minutes, calories_burned")
        .eq("user_id", userId);

      if (error) throw error;

      if (!logs || logs.length === 0) {
        return {
          totalWorkouts: 0,
          totalMinutes: 0,
          totalCalories: 0,
          averageDuration: 0,
          workoutsThisWeek: 0,
          workoutsThisMonth: 0,
          currentStreak: 0,
          longestStreak: 0,
        };
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalWorkouts = logs.length;
      const totalMinutes = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      const totalCalories = logs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
      const averageDuration = totalMinutes / totalWorkouts;

      const workoutsThisWeek = logs.filter(
        log => new Date(log.completed_at) >= oneWeekAgo
      ).length;

      const workoutsThisMonth = logs.filter(
        log => new Date(log.completed_at) >= oneMonthAgo
      ).length;

      // Calculate streaks
      const sortedDates = logs
        .map(log => new Date(log.completed_at).toDateString())
        .filter((date, index, self) => self.indexOf(date) === index)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const expectedDate = new Date(now);
        expectedDate.setDate(expectedDate.getDate() - i);

        if (currentDate.toDateString() === expectedDate.toDateString()) {
          currentStreak++;
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else if (i === 0) {
          break;
        } else {
          tempStreak = 1;
          longestStreak = Math.max(longestStreak, tempStreak);
        }
      }

      return {
        totalWorkouts,
        totalMinutes,
        totalCalories,
        averageDuration: Math.round(averageDuration),
        workoutsThisWeek,
        workoutsThisMonth,
        currentStreak,
        longestStreak,
      };
    },
    enabled: !!userId,
  });

  return {
    workoutLogs: workoutLogs || [],
    stats,
    isLoading: isLoadingLogs || isLoadingStats,
  };
};

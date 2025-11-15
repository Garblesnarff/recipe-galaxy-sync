import { supabase } from "@/integrations/supabase/client";
import { MUSCLE_GROUPS } from "@/types/workout";

/**
 * Get weight progression over time for a specific exercise
 */
export const getWeightProgressionChart = async (
  userId: string,
  exerciseName: string,
  weeks: number = 12
) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const { data, error } = await supabase
      .from("workout_log_exercises")
      .select(`
        *,
        workout_log:workout_logs!inner(
          user_id,
          completed_at
        )
      `)
      .eq("exercise_name", exerciseName)
      .eq("workout_log.user_id", userId)
      .gte("workout_log.completed_at", startDate.toISOString())
      .order("workout_log(completed_at)", { ascending: true });

    if (error) throw error;

    // Process data for charting
    const chartData = data?.map((exercise: any) => {
      const maxWeight = exercise.weight_used?.length > 0
        ? Math.max(...exercise.weight_used)
        : 0;
      const avgWeight = exercise.weight_used?.length > 0
        ? exercise.weight_used.reduce((a: number, b: number) => a + b, 0) / exercise.weight_used.length
        : 0;

      return {
        date: new Date(exercise.workout_log.completed_at).toLocaleDateString(),
        maxWeight,
        avgWeight,
        sets: exercise.sets_completed || 0,
        totalReps: exercise.reps_achieved?.reduce((a: number, b: number) => a + b, 0) || 0,
      };
    }) || [];

    return chartData;
  } catch (error) {
    console.error("Error fetching weight progression:", error);
    throw error;
  }
};

/**
 * Get total volume progression over time (sets x reps x weight)
 */
export const getVolumeProgression = async (userId: string, weeks: number = 12) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    // Get all workout logs in the date range
    const { data: logs, error: logsError } = await supabase
      .from("workout_logs")
      .select(`
        *,
        exercises:workout_log_exercises(*),
        workout:workouts(workout_type)
      `)
      .eq("user_id", userId)
      .gte("completed_at", startDate.toISOString())
      .order("completed_at", { ascending: true });

    if (logsError) throw logsError;

    // Calculate weekly volume
    const weeklyVolume: { [key: string]: { [type: string]: number } } = {};

    logs?.forEach((log: any) => {
      const logDate = new Date(log.completed_at);
      const weekStart = new Date(logDate);
      weekStart.setDate(logDate.getDate() - logDate.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0];

      const workoutType = log.workout?.workout_type || "General";

      if (!weeklyVolume[weekKey]) {
        weeklyVolume[weekKey] = {};
      }

      let totalVolume = 0;
      log.exercises?.forEach((exercise: any) => {
        const { reps_achieved, weight_used } = exercise;
        if (reps_achieved && weight_used) {
          // Calculate volume for each set
          for (let i = 0; i < Math.min(reps_achieved.length, weight_used.length); i++) {
            totalVolume += reps_achieved[i] * weight_used[i];
          }
        }
      });

      weeklyVolume[weekKey][workoutType] =
        (weeklyVolume[weekKey][workoutType] || 0) + totalVolume;
    });

    // Convert to array format for charting
    const chartData = Object.entries(weeklyVolume).map(([week, types]) => {
      const weekData: any = { week };
      let total = 0;
      Object.entries(types).forEach(([type, volume]) => {
        weekData[type] = Math.round(volume);
        total += volume;
      });
      weekData.total = Math.round(total);
      return weekData;
    });

    return chartData;
  } catch (error) {
    console.error("Error fetching volume progression:", error);
    throw error;
  }
};

/**
 * Get muscle group training balance
 */
export const getMuscleGroupBalance = async (userId: string) => {
  try {
    // Get all workout logs with their workouts
    const { data: logs, error } = await supabase
      .from("workout_logs")
      .select(`
        *,
        workout:workouts(target_muscle_groups)
      `)
      .eq("user_id", userId);

    if (error) throw error;

    // Count muscle group frequency
    const muscleGroupCount: { [key: string]: number } = {};
    MUSCLE_GROUPS.forEach(group => {
      muscleGroupCount[group] = 0;
    });

    logs?.forEach((log: any) => {
      const muscleGroups = log.workout?.target_muscle_groups || [];
      muscleGroups.forEach((group: string) => {
        if (muscleGroupCount[group] !== undefined) {
          muscleGroupCount[group] += 1;
        }
      });
    });

    // Convert to array and sort
    const balance = Object.entries(muscleGroupCount)
      .map(([muscleGroup, count]) => ({
        muscleGroup,
        count,
        percentage: logs?.length ? Math.round((count / logs.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return balance;
  } catch (error) {
    console.error("Error fetching muscle group balance:", error);
    throw error;
  }
};

/**
 * Calculate overall strength score (0-100)
 * Based on total volume, consistency, and progression
 */
export const getStrengthScore = async (userId: string) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    // Get recent logs
    const { data: recentLogs, error: recentError } = await supabase
      .from("workout_logs")
      .select(`
        *,
        exercises:workout_log_exercises(*)
      `)
      .eq("user_id", userId)
      .gte("completed_at", thirtyDaysAgo.toISOString());

    if (recentError) throw recentError;

    // Get previous period logs for comparison
    const { data: previousLogs, error: previousError } = await supabase
      .from("workout_logs")
      .select(`
        *,
        exercises:workout_log_exercises(*)
      `)
      .eq("user_id", userId)
      .gte("completed_at", sixtyDaysAgo.toISOString())
      .lt("completed_at", thirtyDaysAgo.toISOString());

    if (previousError) throw previousError;

    // Calculate total volume for both periods
    const calculateVolume = (logs: any[]) => {
      let total = 0;
      logs?.forEach(log => {
        log.exercises?.forEach((exercise: any) => {
          const { reps_achieved, weight_used } = exercise;
          if (reps_achieved && weight_used) {
            for (let i = 0; i < Math.min(reps_achieved.length, weight_used.length); i++) {
              total += reps_achieved[i] * weight_used[i];
            }
          }
        });
      });
      return total;
    };

    const recentVolume = calculateVolume(recentLogs || []);
    const previousVolume = calculateVolume(previousLogs || []);

    // Calculate metrics
    const volumeScore = Math.min((recentVolume / 50000) * 40, 40); // Max 40 points
    const consistencyScore = Math.min((recentLogs?.length || 0) * 2.5, 30); // Max 30 points
    const progressionScore = previousVolume > 0
      ? Math.min(((recentVolume - previousVolume) / previousVolume) * 100, 30)
      : 15; // Max 30 points

    const totalScore = Math.round(Math.min(volumeScore + consistencyScore + progressionScore, 100));

    return {
      totalScore,
      volumeScore: Math.round(volumeScore),
      consistencyScore: Math.round(consistencyScore),
      progressionScore: Math.round(progressionScore),
      recentVolume: Math.round(recentVolume),
      previousVolume: Math.round(previousVolume),
      improvement: previousVolume > 0
        ? Math.round(((recentVolume - previousVolume) / previousVolume) * 100)
        : 0,
    };
  } catch (error) {
    console.error("Error calculating strength score:", error);
    throw error;
  }
};

/**
 * Get workout frequency statistics
 */
export const getWorkoutFrequencyStats = async (userId: string, weeks: number = 12) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const { data, error } = await supabase
      .from("workout_logs")
      .select("completed_at")
      .eq("user_id", userId)
      .gte("completed_at", startDate.toISOString())
      .order("completed_at", { ascending: true });

    if (error) throw error;

    // Group by week
    const weeklyStats: { [key: string]: number } = {};

    data?.forEach((log) => {
      const logDate = new Date(log.completed_at);
      const weekStart = new Date(logDate);
      weekStart.setDate(logDate.getDate() - logDate.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0];

      weeklyStats[weekKey] = (weeklyStats[weekKey] || 0) + 1;
    });

    // Calculate average
    const weekCount = Object.keys(weeklyStats).length;
    const totalWorkouts = Object.values(weeklyStats).reduce((a, b) => a + b, 0);
    const avgPerWeek = weekCount > 0 ? totalWorkouts / weekCount : 0;

    // Convert to chart data
    const chartData = Object.entries(weeklyStats).map(([week, count]) => ({
      week,
      workouts: count,
    }));

    return {
      chartData,
      avgPerWeek: Math.round(avgPerWeek * 10) / 10,
      totalWorkouts,
      weeksTracked: weekCount,
      mostActiveWeek: Math.max(...Object.values(weeklyStats), 0),
      leastActiveWeek: Math.min(...Object.values(weeklyStats), 0),
    };
  } catch (error) {
    console.error("Error fetching workout frequency:", error);
    throw error;
  }
};

/**
 * Get consistency score based on scheduled vs completed workouts
 */
export const getConsistencyScore = async (userId: string) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get completed workouts
    const { data: completedLogs, error: completedError } = await supabase
      .from("workout_logs")
      .select("completed_at")
      .eq("user_id", userId)
      .gte("completed_at", thirtyDaysAgo.toISOString());

    if (completedError) throw completedError;

    // Calculate streak
    const dates = completedLogs?.map(log =>
      new Date(log.completed_at).toDateString()
    ) || [];

    const uniqueDates = [...new Set(dates)].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak
    const today = new Date().toDateString();
    let checkDate = new Date();

    while (uniqueDates.includes(checkDate.toDateString())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate consistency percentage (workouts per week goal: 3-4)
    const weeksPassed = 4; // Last 30 days ≈ 4 weeks
    const expectedWorkouts = weeksPassed * 3; // Minimum 3 per week
    const completionRate = Math.min((completedLogs?.length || 0) / expectedWorkouts * 100, 100);

    return {
      currentStreak,
      longestStreak,
      completionRate: Math.round(completionRate),
      totalWorkouts: completedLogs?.length || 0,
      activeDays: uniqueDates.length,
      avgWorkoutsPerWeek: Math.round(((completedLogs?.length || 0) / weeksPassed) * 10) / 10,
    };
  } catch (error) {
    console.error("Error calculating consistency score:", error);
    throw error;
  }
};

/**
 * Get daily workout frequency for calendar heatmap
 */
export const getDailyWorkoutFrequency = async (userId: string, days: number = 365) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("workout_logs")
      .select("completed_at")
      .eq("user_id", userId)
      .gte("completed_at", startDate.toISOString())
      .order("completed_at", { ascending: true });

    if (error) throw error;

    // Group by day
    const dailyCount: { [key: string]: number } = {};

    data?.forEach((log) => {
      const date = new Date(log.completed_at).toISOString().split('T')[0];
      dailyCount[date] = (dailyCount[date] || 0) + 1;
    });

    // Convert to array
    const heatmapData = Object.entries(dailyCount).map(([date, count]) => ({
      date,
      count,
      level: count >= 3 ? 4 : count >= 2 ? 3 : count >= 1 ? 2 : 1,
    }));

    return heatmapData;
  } catch (error) {
    console.error("Error fetching daily frequency:", error);
    throw error;
  }
};

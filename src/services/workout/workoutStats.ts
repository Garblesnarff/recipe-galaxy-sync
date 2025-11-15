import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches overall workout statistics for a user
 */
export const fetchWorkoutStats = async (userId: string) => {
  try {
    // Get total workouts count
    const { count: totalWorkouts, error: countError } = await supabase
      .from("workout_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) throw countError;

    // Get total time and calories from all workout logs
    const { data: logs, error: logsError } = await supabase
      .from("workout_logs")
      .select("duration_minutes, calories_burned")
      .eq("user_id", userId);

    if (logsError) throw logsError;

    const totalTime = logs?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;
    const totalCalories = logs?.reduce((sum, log) => sum + (log.calories_burned || 0), 0) || 0;

    // Get favorite workouts count
    const { count: favoriteCount, error: favoriteError } = await supabase
      .from("workouts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_favorite", true);

    if (favoriteError) throw favoriteError;

    // Get total custom workouts created
    const { count: customWorkoutsCount, error: customError } = await supabase
      .from("workouts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_template", false);

    if (customError) throw customError;

    return {
      totalWorkouts: totalWorkouts || 0,
      totalTime,
      totalCalories,
      favoriteCount: favoriteCount || 0,
      customWorkoutsCount: customWorkoutsCount || 0,
    };
  } catch (error) {
    console.error("Exception fetching workout stats:", error);
    throw error;
  }
};

/**
 * Fetches progress data for a specific exercise
 * Returns weight progression over time
 */
export const fetchExerciseProgress = async (
  userId: string,
  exerciseName: string,
  limit: number = 10
) => {
  try {
    // Get recent workout logs with this exercise
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
      .order("workout_log(completed_at)", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Format progress data
    const progressData = data?.map((exercise: any) => ({
      date: exercise.workout_log.completed_at,
      exerciseName: exercise.exercise_name,
      setsCompleted: exercise.sets_completed,
      repsAchieved: exercise.reps_achieved,
      weightUsed: exercise.weight_used,
      maxWeight: exercise.weight_used?.length > 0
        ? Math.max(...exercise.weight_used)
        : 0,
      avgWeight: exercise.weight_used?.length > 0
        ? exercise.weight_used.reduce((a: number, b: number) => a + b, 0) / exercise.weight_used.length
        : 0,
      totalReps: exercise.reps_achieved?.length > 0
        ? exercise.reps_achieved.reduce((a: number, b: number) => a + b, 0)
        : 0,
      durationSeconds: exercise.duration_seconds,
    })) || [];

    return progressData.reverse(); // Return oldest to newest for chart display
  } catch (error) {
    console.error("Exception fetching exercise progress:", error);
    throw error;
  }
};

/**
 * Fetches weekly workout activity for charts
 * Returns workout count per week for the last N weeks
 */
export const fetchWeeklyActivity = async (
  userId: string,
  weeksBack: number = 12
) => {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeksBack * 7));

    // Fetch all workout logs in the date range
    const { data, error } = await supabase
      .from("workout_logs")
      .select("completed_at, duration_minutes, calories_burned")
      .eq("user_id", userId)
      .gte("completed_at", startDate.toISOString())
      .lte("completed_at", endDate.toISOString())
      .order("completed_at", { ascending: true });

    if (error) throw error;

    // Group by week
    const weeklyData: { [key: string]: { count: number; totalMinutes: number; totalCalories: number } } = {};

    data?.forEach((log) => {
      const logDate = new Date(log.completed_at);
      // Get the Monday of the week (start of week)
      const weekStart = new Date(logDate);
      weekStart.setDate(logDate.getDate() - logDate.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { count: 0, totalMinutes: 0, totalCalories: 0 };
      }

      weeklyData[weekKey].count += 1;
      weeklyData[weekKey].totalMinutes += log.duration_minutes || 0;
      weeklyData[weekKey].totalCalories += log.calories_burned || 0;
    });

    // Convert to array and sort by date
    const weeklyArray = Object.entries(weeklyData).map(([week, stats]) => ({
      week,
      workoutCount: stats.count,
      totalMinutes: stats.totalMinutes,
      totalCalories: stats.totalCalories,
      avgDuration: stats.count > 0 ? Math.round(stats.totalMinutes / stats.count) : 0,
    })).sort((a, b) => a.week.localeCompare(b.week));

    return weeklyArray;
  } catch (error) {
    console.error("Exception fetching weekly activity:", error);
    throw error;
  }
};

/**
 * Fetches personal records for all exercises
 */
export const fetchPersonalRecords = async (userId: string) => {
  try {
    // Get all workout log exercises for this user
    const { data, error } = await supabase
      .from("workout_log_exercises")
      .select(`
        exercise_name,
        weight_used,
        reps_achieved,
        workout_log:workout_logs!inner(
          user_id,
          completed_at
        )
      `)
      .eq("workout_log.user_id", userId);

    if (error) throw error;

    // Calculate PRs for each exercise
    const exercisePRs: { [key: string]: { maxWeight: number; date: string; totalReps: number } } = {};

    data?.forEach((exercise: any) => {
      const exerciseName = exercise.exercise_name;
      const maxWeight = exercise.weight_used?.length > 0
        ? Math.max(...exercise.weight_used)
        : 0;
      const totalReps = exercise.reps_achieved?.length > 0
        ? exercise.reps_achieved.reduce((a: number, b: number) => a + b, 0)
        : 0;

      if (!exercisePRs[exerciseName] || maxWeight > exercisePRs[exerciseName].maxWeight) {
        exercisePRs[exerciseName] = {
          maxWeight,
          date: exercise.workout_log.completed_at,
          totalReps,
        };
      }
    });

    // Convert to array
    const prsArray = Object.entries(exercisePRs).map(([exerciseName, pr]) => ({
      exerciseName,
      maxWeight: pr.maxWeight,
      date: pr.date,
      totalReps: pr.totalReps,
    })).sort((a, b) => b.maxWeight - a.maxWeight);

    return prsArray;
  } catch (error) {
    console.error("Exception fetching personal records:", error);
    throw error;
  }
};

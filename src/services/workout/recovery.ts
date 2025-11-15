import { supabase } from "@/integrations/supabase/client";

export interface RestDayData {
  date: string;
  recovery_type?: "active" | "passive" | "complete";
  notes?: string;
  sleep_hours?: number;
  soreness_level?: number;
  energy_level?: number;
}

export interface RestDay extends RestDayData {
  id: string;
  user_id: string;
  created_at: string;
}

export interface RecoveryFactors {
  sleep: number;
  soreness: number;
  energy: number;
  workouts_this_week: number;
  days_since_rest: number;
  recent_intensity: number;
}

export interface RecoveryScore {
  id: string;
  user_id: string;
  date: string;
  score: number;
  factors: RecoveryFactors;
  recommendation: string;
  created_at: string;
}

/**
 * Log a rest day for a user
 */
export const logRestDay = async (
  userId: string,
  data: RestDayData
): Promise<RestDay> => {
  try {
    const { data: restDay, error } = await supabase
      .from("rest_days")
      .insert({
        user_id: userId,
        date: data.date,
        recovery_type: data.recovery_type,
        notes: data.notes,
        sleep_hours: data.sleep_hours,
        soreness_level: data.soreness_level,
        energy_level: data.energy_level,
      })
      .select()
      .single();

    if (error) throw error;
    return restDay;
  } catch (error) {
    console.error("Error logging rest day:", error);
    throw error;
  }
};

/**
 * Get rest days for a user within a date range
 */
export const getRestDays = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<RestDay[]> => {
  try {
    const { data, error } = await supabase
      .from("rest_days")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching rest days:", error);
    throw error;
  }
};

/**
 * Calculate the number of workouts in the past week
 */
const getWorkoutsThisWeek = async (userId: string): Promise<number> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { count, error } = await supabase
    .from("workout_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("completed_at", oneWeekAgo.toISOString());

  if (error) throw error;
  return count || 0;
};

/**
 * Calculate days since last rest day
 */
const getDaysSinceLastRest = async (userId: string): Promise<number> => {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("rest_days")
    .select("date")
    .eq("user_id", userId)
    .lt("date", today)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  if (!data) return 999; // No previous rest days

  const lastRestDate = new Date(data.date);
  const todayDate = new Date(today);
  const diffTime = Math.abs(todayDate.getTime() - lastRestDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Calculate average workout intensity (calories) in the past week
 */
const getRecentIntensity = async (userId: string): Promise<number> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("workout_logs")
    .select("calories_burned")
    .eq("user_id", userId)
    .gte("completed_at", oneWeekAgo.toISOString());

  if (error) throw error;

  if (!data || data.length === 0) return 0;

  const totalCalories = data.reduce(
    (sum, log) => sum + (log.calories_burned || 0),
    0
  );
  return totalCalories / data.length;
};

/**
 * Get today's rest day data if it exists
 */
const getTodayRestData = async (
  userId: string,
  date: string
): Promise<RestDay | null> => {
  const { data, error } = await supabase
    .from("rest_days")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
};

/**
 * Generate recommendation based on recovery score
 */
const generateRecommendation = (
  score: number,
  factors: RecoveryFactors
): string => {
  if (score >= 80) {
    return "Great recovery! You're ready for an intense workout.";
  } else if (score >= 60) {
    return "Good recovery. You can do a moderate workout today.";
  } else if (score >= 40) {
    if (factors.soreness > 6) {
      return "High soreness detected. Consider an active recovery day with light stretching or yoga.";
    }
    if (factors.days_since_rest > 5) {
      return "You haven't rested in a while. Consider taking a full rest day.";
    }
    if (factors.sleep < 6) {
      return "Low sleep detected. Prioritize rest and recovery today.";
    }
    return "Moderate recovery. Consider a light workout or active recovery.";
  } else {
    if (factors.days_since_rest >= 7) {
      return "Your body needs rest! You've been working out for 7+ consecutive days. Take a complete rest day.";
    }
    if (factors.soreness >= 8) {
      return "Very high soreness level. Take a complete rest day and focus on recovery.";
    }
    if (factors.sleep < 5) {
      return "Severe sleep deficit. Your body needs rest to recover properly.";
    }
    return "Low recovery score. Your body needs rest. Consider taking a complete rest day.";
  }
};

/**
 * Calculate recovery score for a user on a specific date
 * Algorithm:
 * Base: 50
 * Sleep: +5 per hour up to 8 hours (max +40)
 * Soreness: -(soreness_level * 5) (max -50)
 * Energy: +(energy_level * 3) (max +30)
 * Workouts this week: -(count * 3) beyond 4 (max -15)
 * Days since rest: -(days * 5) beyond 2 (max -25)
 * Recent intensity: -(avg_calories * 0.01) (max -20)
 */
export const calculateRecoveryScore = async (
  userId: string,
  date?: string
): Promise<RecoveryScore> => {
  try {
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Get all factors
    const [
      workoutsThisWeek,
      daysSinceRest,
      recentIntensity,
      todayRestData,
    ] = await Promise.all([
      getWorkoutsThisWeek(userId),
      getDaysSinceLastRest(userId),
      getRecentIntensity(userId),
      getTodayRestData(userId, targetDate),
    ]);

    // Use default values if no rest data logged today
    const sleepHours = todayRestData?.sleep_hours || 7;
    const sorenessLevel = todayRestData?.soreness_level || 5;
    const energyLevel = todayRestData?.energy_level || 5;

    // Calculate score components
    let score = 50; // Base score

    // Sleep contribution: +5 per hour up to 8 hours (max +40)
    const sleepBonus = Math.min(sleepHours * 5, 40);
    score += sleepBonus;

    // Soreness penalty: -(soreness_level * 5) (max -50)
    const sorenessPenalty = Math.min(sorenessLevel * 5, 50);
    score -= sorenessPenalty;

    // Energy contribution: +(energy_level * 3) (max +30)
    const energyBonus = Math.min(energyLevel * 3, 30);
    score += energyBonus;

    // Workouts this week penalty: -(count * 3) beyond 4 (max -15)
    if (workoutsThisWeek > 4) {
      const workoutPenalty = Math.min((workoutsThisWeek - 4) * 3, 15);
      score -= workoutPenalty;
    }

    // Days since rest penalty: -(days * 5) beyond 2 (max -25)
    if (daysSinceRest > 2) {
      const restPenalty = Math.min((daysSinceRest - 2) * 5, 25);
      score -= restPenalty;
    }

    // Recent intensity penalty: -(avg_calories * 0.01) (max -20)
    const intensityPenalty = Math.min(recentIntensity * 0.01, 20);
    score -= intensityPenalty;

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, Math.round(score)));

    const factors: RecoveryFactors = {
      sleep: sleepHours,
      soreness: sorenessLevel,
      energy: energyLevel,
      workouts_this_week: workoutsThisWeek,
      days_since_rest: daysSinceRest,
      recent_intensity: Math.round(recentIntensity),
    };

    const recommendation = generateRecommendation(score, factors);

    // Save or update recovery score
    const { data: existingScore } = await supabase
      .from("recovery_scores")
      .select("id")
      .eq("user_id", userId)
      .eq("date", targetDate)
      .single();

    let recoveryScore;

    if (existingScore) {
      // Update existing score
      const { data, error } = await supabase
        .from("recovery_scores")
        .update({
          score,
          factors,
          recommendation,
        })
        .eq("id", existingScore.id)
        .select()
        .single();

      if (error) throw error;
      recoveryScore = data;
    } else {
      // Insert new score
      const { data, error } = await supabase
        .from("recovery_scores")
        .insert({
          user_id: userId,
          date: targetDate,
          score,
          factors,
          recommendation,
        })
        .select()
        .single();

      if (error) throw error;
      recoveryScore = data;
    }

    return recoveryScore;
  } catch (error) {
    console.error("Error calculating recovery score:", error);
    throw error;
  }
};

/**
 * Suggest if user needs a rest day based on various factors
 */
export const suggestRestDay = async (userId: string): Promise<{
  shouldRest: boolean;
  reason: string;
  severity: "low" | "medium" | "high";
}> => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get recovery score
    const recoveryScore = await calculateRecoveryScore(userId, today);

    // Get consecutive workout days
    const daysSinceRest = recoveryScore.factors.days_since_rest;

    // Get recent low recovery days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: recentScores, error } = await supabase
      .from("recovery_scores")
      .select("score, date")
      .eq("user_id", userId)
      .gte("date", fourteenDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: false })
      .limit(14);

    if (error) throw error;

    const lowRecoveryDays =
      recentScores?.filter((s) => s.score < 40).length || 0;

    // Check rest days in last 14 days
    const { count: restDaysCount } = await supabase
      .from("rest_days")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("date", fourteenDaysAgo.toISOString().split("T")[0]);

    // Determine if rest is needed
    if (daysSinceRest >= 7) {
      return {
        shouldRest: true,
        reason: `You've worked out for ${daysSinceRest} consecutive days. Your body needs recovery time.`,
        severity: "high",
      };
    }

    if (lowRecoveryDays >= 2) {
      return {
        shouldRest: true,
        reason: `Your recovery score has been below 40 for ${lowRecoveryDays} days. Time to prioritize rest.`,
        severity: "high",
      };
    }

    if (recoveryScore.factors.soreness >= 8) {
      return {
        shouldRest: true,
        reason: "High soreness level detected. Your muscles need time to recover.",
        severity: "medium",
      };
    }

    if ((restDaysCount || 0) === 0) {
      return {
        shouldRest: true,
        reason: "You haven't taken any rest days in the past 2 weeks. Consider scheduling one.",
        severity: "medium",
      };
    }

    if (daysSinceRest >= 5 && recoveryScore.score < 60) {
      return {
        shouldRest: true,
        reason: `${daysSinceRest} days without rest and low recovery score. Consider an active recovery day.`,
        severity: "low",
      };
    }

    return {
      shouldRest: false,
      reason: "You're recovering well. Keep up the good work!",
      severity: "low",
    };
  } catch (error) {
    console.error("Error suggesting rest day:", error);
    throw error;
  }
};

/**
 * Get recovery score history for a user
 */
export const getRecoveryHistory = async (
  userId: string,
  days: number = 30
): Promise<RecoveryScore[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("recovery_scores")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching recovery history:", error);
    throw error;
  }
};

/**
 * Update an existing rest day
 */
export const updateRestDay = async (
  restDayId: string,
  data: Partial<RestDayData>
): Promise<RestDay> => {
  try {
    const { data: restDay, error } = await supabase
      .from("rest_days")
      .update(data)
      .eq("id", restDayId)
      .select()
      .single();

    if (error) throw error;
    return restDay;
  } catch (error) {
    console.error("Error updating rest day:", error);
    throw error;
  }
};

/**
 * Delete a rest day
 */
export const deleteRestDay = async (restDayId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("rest_days")
      .delete()
      .eq("id", restDayId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting rest day:", error);
    throw error;
  }
};

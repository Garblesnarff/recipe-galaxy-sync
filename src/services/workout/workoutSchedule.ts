import { supabase } from "@/integrations/supabase/client";

export interface WorkoutSchedule {
  id: string;
  user_id: string;
  workout_id: string | null;
  day_of_week: number | null;
  time_of_day: string | null;
  scheduled_date: string | null;
  is_active: boolean;
  reminder_enabled: boolean;
  reminder_minutes_before: number;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleData {
  workout_id: string;
  day_of_week?: number | null;
  time_of_day?: string;
  scheduled_date?: string | null;
  reminder_enabled?: boolean;
  reminder_minutes_before?: number;
}

export interface UpdateScheduleData {
  workout_id?: string;
  day_of_week?: number | null;
  time_of_day?: string;
  scheduled_date?: string | null;
  is_active?: boolean;
  reminder_enabled?: boolean;
  reminder_minutes_before?: number;
}

/**
 * Creates a new workout schedule (recurring or one-time)
 */
export const createSchedule = async (
  userId: string,
  scheduleData: CreateScheduleData
) => {
  try {
    const { data, error } = await supabase
      .from("workout_schedule")
      .insert({
        user_id: userId,
        workout_id: scheduleData.workout_id,
        day_of_week: scheduleData.day_of_week ?? null,
        time_of_day: scheduleData.time_of_day || null,
        scheduled_date: scheduleData.scheduled_date ?? null,
        reminder_enabled: scheduleData.reminder_enabled ?? true,
        reminder_minutes_before: scheduleData.reminder_minutes_before ?? 60,
      })
      .select()
      .single();

    if (error) throw error;
    return data as WorkoutSchedule;
  } catch (error) {
    console.error("Error creating workout schedule:", error);
    throw error;
  }
};

/**
 * Gets scheduled workouts for a specific date
 */
export const getScheduledWorkouts = async (
  userId: string,
  date?: Date
) => {
  try {
    const targetDate = date || new Date();
    const dayOfWeek = targetDate.getDay();
    const dateString = targetDate.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("workout_schedule")
      .select(`
        *,
        workout:workouts(
          *,
          exercises:workout_exercises(*)
        )
      `)
      .eq("user_id", userId)
      .eq("is_active", true)
      .or(`day_of_week.eq.${dayOfWeek},scheduled_date.eq.${dateString}`);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching scheduled workouts:", error);
    throw error;
  }
};

/**
 * Gets all active schedules for a user
 */
export const getAllSchedules = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("workout_schedule")
      .select(`
        *,
        workout:workouts(
          *,
          exercises:workout_exercises(*)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching all schedules:", error);
    throw error;
  }
};

/**
 * Gets upcoming scheduled workouts for the next N days
 */
export const getUpcomingWorkouts = async (
  userId: string,
  days: number = 7
) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    // Get all active schedules
    const { data: schedules, error } = await supabase
      .from("workout_schedule")
      .select(`
        *,
        workout:workouts(
          *,
          exercises:workout_exercises(*)
        )
      `)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) throw error;

    // Process schedules to find upcoming workouts
    const upcomingWorkouts: any[] = [];
    const todayString = today.toISOString().split("T")[0];
    const futureDateString = futureDate.toISOString().split("T")[0];

    schedules?.forEach((schedule) => {
      if (schedule.scheduled_date) {
        // One-time schedule
        if (
          schedule.scheduled_date >= todayString &&
          schedule.scheduled_date <= futureDateString
        ) {
          upcomingWorkouts.push({
            ...schedule,
            scheduled_for: schedule.scheduled_date,
          });
        }
      } else if (schedule.day_of_week !== null) {
        // Recurring schedule - find next occurrence within the date range
        for (let i = 0; i < days; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() + i);
          if (checkDate.getDay() === schedule.day_of_week) {
            upcomingWorkouts.push({
              ...schedule,
              scheduled_for: checkDate.toISOString().split("T")[0],
            });
          }
        }
      }
    });

    // Sort by scheduled_for date
    upcomingWorkouts.sort(
      (a, b) =>
        new Date(a.scheduled_for).getTime() -
        new Date(b.scheduled_for).getTime()
    );

    return upcomingWorkouts;
  } catch (error) {
    console.error("Error fetching upcoming workouts:", error);
    throw error;
  }
};

/**
 * Updates an existing workout schedule
 */
export const updateSchedule = async (
  scheduleId: string,
  updates: UpdateScheduleData
) => {
  try {
    const { data, error } = await supabase
      .from("workout_schedule")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scheduleId)
      .select()
      .single();

    if (error) throw error;
    return data as WorkoutSchedule;
  } catch (error) {
    console.error("Error updating workout schedule:", error);
    throw error;
  }
};

/**
 * Deletes a workout schedule
 */
export const deleteSchedule = async (scheduleId: string) => {
  try {
    const { error } = await supabase
      .from("workout_schedule")
      .delete()
      .eq("id", scheduleId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting workout schedule:", error);
    throw error;
  }
};

/**
 * Toggles the active status of a schedule
 */
export const toggleScheduleActive = async (
  scheduleId: string,
  isActive: boolean
) => {
  try {
    return await updateSchedule(scheduleId, { is_active: isActive });
  } catch (error) {
    console.error("Error toggling schedule active status:", error);
    throw error;
  }
};

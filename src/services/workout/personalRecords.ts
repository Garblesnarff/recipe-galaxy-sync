import { supabase } from "@/integrations/supabase/client";
import type { PersonalRecord } from "@/types/workout";

/**
 * Detects if a new personal record was achieved for an exercise
 */
export const detectNewPR = async (
  userId: string,
  exerciseName: string,
  logData: {
    reps_achieved?: number[];
    weight_used?: number[];
    duration_seconds?: number;
  }
): Promise<{
  hasNewPR: boolean;
  prType?: 'max_weight' | 'max_reps' | 'max_duration';
  newValue?: number;
  previousValue?: number;
}> => {
  try {
    // Get existing PRs for this exercise
    const existingPRs = await getExercisePRs(userId, exerciseName);

    let hasNewPR = false;
    let prType: 'max_weight' | 'max_reps' | 'max_duration' | undefined;
    let newValue: number | undefined;
    let previousValue: number | undefined;

    // Check for max weight PR
    if (logData.weight_used && logData.weight_used.length > 0) {
      const maxWeight = Math.max(...logData.weight_used);
      const existingMaxWeight = existingPRs.find(pr => pr.record_type === 'max_weight');

      if (!existingMaxWeight || maxWeight > existingMaxWeight.value) {
        hasNewPR = true;
        prType = 'max_weight';
        newValue = maxWeight;
        previousValue = existingMaxWeight?.value;
      }
    }

    // Check for max reps PR
    if (logData.reps_achieved && logData.reps_achieved.length > 0) {
      const maxReps = Math.max(...logData.reps_achieved);
      const existingMaxReps = existingPRs.find(pr => pr.record_type === 'max_reps');

      if (!existingMaxReps || maxReps > existingMaxReps.value) {
        hasNewPR = true;
        prType = 'max_reps';
        newValue = maxReps;
        previousValue = existingMaxReps?.value;
      }
    }

    // Check for max duration PR
    if (logData.duration_seconds) {
      const existingMaxDuration = existingPRs.find(pr => pr.record_type === 'max_duration');

      if (!existingMaxDuration || logData.duration_seconds > existingMaxDuration.value) {
        hasNewPR = true;
        prType = 'max_duration';
        newValue = logData.duration_seconds;
        previousValue = existingMaxDuration?.value;
      }
    }

    return { hasNewPR, prType, newValue, previousValue };
  } catch (error) {
    console.error("Exception detecting new PR:", error);
    return { hasNewPR: false };
  }
};

/**
 * Saves a personal record to the database
 */
export const savePersonalRecord = async (
  userId: string,
  exerciseName: string,
  recordType: 'max_weight' | 'max_reps' | 'max_duration',
  value: number,
  workoutLogId?: string
): Promise<PersonalRecord | null> => {
  try {
    const { data, error } = await supabase
      .from("personal_records")
      .upsert({
        user_id: userId,
        exercise_name: exerciseName,
        record_type: recordType,
        value,
        workout_log_id: workoutLogId,
        achieved_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,exercise_name,record_type'
      })
      .select()
      .single();

    if (error) throw error;
    return data as PersonalRecord;
  } catch (error) {
    console.error("Exception saving personal record:", error);
    return null;
  }
};

/**
 * Gets all personal records for a user
 */
export const getPersonalRecords = async (
  userId: string
): Promise<PersonalRecord[]> => {
  try {
    const { data, error } = await supabase
      .from("personal_records")
      .select("*")
      .eq("user_id", userId)
      .order("achieved_at", { ascending: false });

    if (error) throw error;
    return data as PersonalRecord[];
  } catch (error) {
    console.error("Exception fetching personal records:", error);
    return [];
  }
};

/**
 * Gets personal records for a specific exercise
 */
export const getExercisePRs = async (
  userId: string,
  exerciseName: string
): Promise<PersonalRecord[]> => {
  try {
    const { data, error } = await supabase
      .from("personal_records")
      .select("*")
      .eq("user_id", userId)
      .eq("exercise_name", exerciseName);

    if (error) throw error;
    return data as PersonalRecord[];
  } catch (error) {
    console.error("Exception fetching exercise PRs:", error);
    return [];
  }
};

/**
 * Deletes a personal record
 */
export const deletePersonalRecord = async (
  recordId: string
): Promise<{ success: boolean }> => {
  try {
    const { error } = await supabase
      .from("personal_records")
      .delete()
      .eq("id", recordId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Exception deleting personal record:", error);
    return { success: false };
  }
};

/**
 * Auto-detects and saves PRs from workout log exercises
 */
export const autoDetectAndSavePRs = async (
  userId: string,
  workoutLogId: string,
  exercises: Array<{
    exercise_name: string;
    reps_achieved?: number[];
    weight_used?: number[];
    duration_seconds?: number;
  }>
): Promise<PersonalRecord[]> => {
  const newPRs: PersonalRecord[] = [];

  try {
    for (const exercise of exercises) {
      const prCheck = await detectNewPR(userId, exercise.exercise_name, {
        reps_achieved: exercise.reps_achieved,
        weight_used: exercise.weight_used,
        duration_seconds: exercise.duration_seconds,
      });

      if (prCheck.hasNewPR && prCheck.prType && prCheck.newValue !== undefined) {
        const savedPR = await savePersonalRecord(
          userId,
          exercise.exercise_name,
          prCheck.prType,
          prCheck.newValue,
          workoutLogId
        );

        if (savedPR) {
          newPRs.push(savedPR);
        }
      }
    }

    return newPRs;
  } catch (error) {
    console.error("Exception auto-detecting PRs:", error);
    return newPRs;
  }
};

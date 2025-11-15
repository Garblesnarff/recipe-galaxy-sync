import { supabase } from "@/integrations/supabase/client";

export interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  duration_weeks: number;
  difficulty: string;
  goal: string;
  is_system_program: boolean;
  created_by: string | null;
  image_url: string | null;
  created_at: string;
}

export interface ProgramWeek {
  id: string;
  program_id: string;
  week_number: number;
  focus: string;
  description: string;
  created_at: string;
}

export interface ProgramWorkout {
  id: string;
  program_week_id: string;
  workout_id: string | null;
  day_of_week: number;
  order_index: number;
  created_at: string;
}

export interface UserProgramEnrollment {
  id: string;
  user_id: string;
  program_id: string;
  started_at: string;
  current_week: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface ProgramWorkoutCompletion {
  id: string;
  enrollment_id: string;
  program_workout_id: string;
  workout_log_id: string | null;
  completed_at: string;
  created_at: string;
}

export interface ProgramFilters {
  goal?: string;
  difficulty?: string;
  minWeeks?: number;
  maxWeeks?: number;
}

/**
 * Fetches all training programs with optional filters
 */
export const getTrainingPrograms = async (filters?: ProgramFilters) => {
  try {
    let query = supabase
      .from("training_programs")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.goal) {
      query = query.eq("goal", filters.goal);
    }

    if (filters?.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
    }

    if (filters?.minWeeks) {
      query = query.gte("duration_weeks", filters.minWeeks);
    }

    if (filters?.maxWeeks) {
      query = query.lte("duration_weeks", filters.maxWeeks);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as TrainingProgram[];
  } catch (error) {
    console.error("Exception fetching training programs:", error);
    throw error;
  }
};

/**
 * Fetches a single program with all weeks and workouts
 */
export const getProgramDetail = async (programId: string) => {
  try {
    const { data: program, error: programError } = await supabase
      .from("training_programs")
      .select("*")
      .eq("id", programId)
      .single();

    if (programError) throw programError;

    const { data: weeks, error: weeksError } = await supabase
      .from("program_weeks")
      .select(`
        *,
        workouts:program_workouts(
          *,
          workout:workouts(*)
        )
      `)
      .eq("program_id", programId)
      .order("week_number", { ascending: true });

    if (weeksError) throw weeksError;

    return {
      ...program,
      weeks: weeks || [],
    };
  } catch (error) {
    console.error("Exception fetching program detail:", error);
    throw error;
  }
};

/**
 * Enrolls a user in a training program
 */
export const enrollInProgram = async (userId: string, programId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_program_enrollments")
      .insert({
        user_id: userId,
        program_id: programId,
        current_week: 1,
        completed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserProgramEnrollment;
  } catch (error) {
    console.error("Exception enrolling in program:", error);
    throw error;
  }
};

/**
 * Gets the current week's workouts for an enrollment
 */
export const getCurrentWeekWorkouts = async (enrollmentId: string) => {
  try {
    // Get enrollment to find current week
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("user_program_enrollments")
      .select("current_week, program_id")
      .eq("id", enrollmentId)
      .single();

    if (enrollmentError) throw enrollmentError;

    // Get the week details
    const { data: week, error: weekError } = await supabase
      .from("program_weeks")
      .select(`
        *,
        workouts:program_workouts(
          *,
          workout:workouts(*),
          completion:program_workout_completions(*)
        )
      `)
      .eq("program_id", enrollment.program_id)
      .eq("week_number", enrollment.current_week)
      .single();

    if (weekError) throw weekError;

    return week;
  } catch (error) {
    console.error("Exception fetching current week workouts:", error);
    throw error;
  }
};

/**
 * Marks a program workout as complete
 */
export const markWorkoutComplete = async (
  enrollmentId: string,
  programWorkoutId: string,
  workoutLogId?: string
) => {
  try {
    const { data, error } = await supabase
      .from("program_workout_completions")
      .insert({
        enrollment_id: enrollmentId,
        program_workout_id: programWorkoutId,
        workout_log_id: workoutLogId || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProgramWorkoutCompletion;
  } catch (error) {
    console.error("Exception marking workout complete:", error);
    throw error;
  }
};

/**
 * Gets the progress percentage for a program enrollment
 */
export const getProgramProgress = async (enrollmentId: string) => {
  try {
    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("user_program_enrollments")
      .select("program_id, current_week")
      .eq("id", enrollmentId)
      .single();

    if (enrollmentError) throw enrollmentError;

    // Get total workouts in program
    const { data: allWorkouts, error: workoutsError } = await supabase
      .from("program_workouts")
      .select("id, program_weeks!inner(program_id)")
      .eq("program_weeks.program_id", enrollment.program_id);

    if (workoutsError) throw workoutsError;

    const totalWorkouts = allWorkouts?.length || 0;

    // Get completed workouts
    const { data: completedWorkouts, error: completedError } = await supabase
      .from("program_workout_completions")
      .select("id")
      .eq("enrollment_id", enrollmentId);

    if (completedError) throw completedError;

    const completedCount = completedWorkouts?.length || 0;

    return {
      totalWorkouts,
      completedWorkouts: completedCount,
      percentage: totalWorkouts > 0 ? (completedCount / totalWorkouts) * 100 : 0,
    };
  } catch (error) {
    console.error("Exception getting program progress:", error);
    throw error;
  }
};

/**
 * Advances user to the next week in their program
 */
export const advanceToNextWeek = async (enrollmentId: string) => {
  try {
    // Get current enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("user_program_enrollments")
      .select("current_week, program_id")
      .eq("id", enrollmentId)
      .single();

    if (enrollmentError) throw enrollmentError;

    // Get program duration
    const { data: program, error: programError } = await supabase
      .from("training_programs")
      .select("duration_weeks")
      .eq("id", enrollment.program_id)
      .single();

    if (programError) throw programError;

    const nextWeek = enrollment.current_week + 1;
    const isCompleted = nextWeek > program.duration_weeks;

    // Update enrollment
    const { data, error } = await supabase
      .from("user_program_enrollments")
      .update({
        current_week: isCompleted ? enrollment.current_week : nextWeek,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq("id", enrollmentId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProgramEnrollment;
  } catch (error) {
    console.error("Exception advancing to next week:", error);
    throw error;
  }
};

/**
 * Gets all program enrollments for a user
 */
export const getUserEnrollments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_program_enrollments")
      .select(`
        *,
        program:training_programs(*)
      `)
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Exception fetching user enrollments:", error);
    throw error;
  }
};

/**
 * Gets active (non-completed) enrollments for a user
 */
export const getActiveEnrollments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_program_enrollments")
      .select(`
        *,
        program:training_programs(*)
      `)
      .eq("user_id", userId)
      .eq("completed", false)
      .order("started_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Exception fetching active enrollments:", error);
    throw error;
  }
};

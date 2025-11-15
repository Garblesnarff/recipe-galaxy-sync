import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "./userProfiles";

export type ActivityType =
  | "workout_completed"
  | "pr_achieved"
  | "achievement_unlocked"
  | "program_started"
  | "program_completed";

export interface ActivityMetadata {
  workout_id?: string;
  workout_name?: string;
  exercise_name?: string;
  pr_value?: number;
  pr_unit?: string;
  achievement_id?: string;
  achievement_name?: string;
  achievement_description?: string;
  program_id?: string;
  program_name?: string;
  [key: string]: any;
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  metadata: ActivityMetadata;
  created_at: string;
  user_profile?: UserProfile;
}

/**
 * Create a new activity
 */
export const createActivity = async (
  userId: string,
  activityType: ActivityType,
  metadata: ActivityMetadata = {}
): Promise<Activity> => {
  try {
    const { data, error } = await supabase
      .from("activity_feed")
      .insert({
        user_id: userId,
        activity_type: activityType,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Activity;
  } catch (error) {
    console.error("Error creating activity:", error);
    throw error;
  }
};

/**
 * Get activity feed for a user (includes own activity and followed users)
 */
export const getFeed = async (
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Activity[]> => {
  try {
    // Get list of users being followed
    const { data: following } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", userId);

    const followingIds = following?.map(f => f.following_id) || [];

    // Include own user_id in the list
    const userIds = [userId, ...followingIds];

    // Get activities from those users
    const { data, error } = await supabase
      .from("activity_feed")
      .select(`
        *,
        user_profile:user_profiles!activity_feed_user_id_fkey(*)
      `)
      .in("user_id", userIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data as any as Activity[];
  } catch (error) {
    console.error("Error fetching feed:", error);
    throw error;
  }
};

/**
 * Get activity for a specific user
 */
export const getUserActivity = async (
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Activity[]> => {
  try {
    const { data, error } = await supabase
      .from("activity_feed")
      .select(`
        *,
        user_profile:user_profiles!activity_feed_user_id_fkey(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data as any as Activity[];
  } catch (error) {
    console.error("Error fetching user activity:", error);
    throw error;
  }
};

/**
 * Get activity feed filtered by type
 */
export const getFeedByType = async (
  userId: string,
  activityType: ActivityType,
  limit: number = 50,
  offset: number = 0
): Promise<Activity[]> => {
  try {
    // Get list of users being followed
    const { data: following } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", userId);

    const followingIds = following?.map(f => f.following_id) || [];

    // Include own user_id in the list
    const userIds = [userId, ...followingIds];

    // Get activities from those users filtered by type
    const { data, error } = await supabase
      .from("activity_feed")
      .select(`
        *,
        user_profile:user_profiles!activity_feed_user_id_fkey(*)
      `)
      .in("user_id", userIds)
      .eq("activity_type", activityType)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data as any as Activity[];
  } catch (error) {
    console.error("Error fetching feed by type:", error);
    throw error;
  }
};

/**
 * Delete an activity
 */
export const deleteActivity = async (activityId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("activity_feed")
      .delete()
      .eq("id", activityId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting activity:", error);
    throw error;
  }
};

/**
 * Delete all activities for a user
 */
export const deleteUserActivities = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("activity_feed")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting user activities:", error);
    throw error;
  }
};

/**
 * Get recent activities (public feed)
 */
export const getRecentActivities = async (
  limit: number = 50,
  offset: number = 0
): Promise<Activity[]> => {
  try {
    // Get activities from public profiles only
    const { data: publicProfiles } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("is_public", true);

    if (!publicProfiles || publicProfiles.length === 0) {
      return [];
    }

    const publicUserIds = publicProfiles.map(p => p.user_id);

    const { data, error } = await supabase
      .from("activity_feed")
      .select(`
        *,
        user_profile:user_profiles!activity_feed_user_id_fkey(*)
      `)
      .in("user_id", publicUserIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data as any as Activity[];
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw error;
  }
};

/**
 * Get activity count for a user
 */
export const getActivityCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("activity_feed")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error fetching activity count:", error);
    return 0;
  }
};

/**
 * Create workout completed activity
 */
export const createWorkoutCompletedActivity = async (
  userId: string,
  workoutId: string,
  workoutName: string,
  durationMinutes?: number
): Promise<Activity> => {
  return createActivity(userId, "workout_completed", {
    workout_id: workoutId,
    workout_name: workoutName,
    duration_minutes: durationMinutes,
  });
};

/**
 * Create PR achieved activity
 */
export const createPRActivity = async (
  userId: string,
  exerciseName: string,
  prValue: number,
  prUnit: string
): Promise<Activity> => {
  return createActivity(userId, "pr_achieved", {
    exercise_name: exerciseName,
    pr_value: prValue,
    pr_unit: prUnit,
  });
};

/**
 * Create achievement unlocked activity
 */
export const createAchievementActivity = async (
  userId: string,
  achievementId: string,
  achievementName: string,
  achievementDescription?: string
): Promise<Activity> => {
  return createActivity(userId, "achievement_unlocked", {
    achievement_id: achievementId,
    achievement_name: achievementName,
    achievement_description: achievementDescription,
  });
};

/**
 * Create program started activity
 */
export const createProgramStartedActivity = async (
  userId: string,
  programId: string,
  programName: string
): Promise<Activity> => {
  return createActivity(userId, "program_started", {
    program_id: programId,
    program_name: programName,
  });
};

/**
 * Create program completed activity
 */
export const createProgramCompletedActivity = async (
  userId: string,
  programId: string,
  programName: string
): Promise<Activity> => {
  return createActivity(userId, "program_completed", {
    program_id: programId,
    program_name: programName,
  });
};

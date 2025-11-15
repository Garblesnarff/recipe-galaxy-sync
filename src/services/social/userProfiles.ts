import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserProfileData {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  isPublic?: boolean;
}

export interface UpdateUserProfileData {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  isPublic?: boolean;
}

/**
 * Creates a new user profile
 */
export const createUserProfile = async (data: CreateUserProfileData): Promise<UserProfile> => {
  try {
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .insert({
        user_id: data.userId,
        username: data.username,
        display_name: data.displayName,
        avatar_url: data.avatarUrl,
        bio: data.bio,
        is_public: data.isPublic ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return profile as UserProfile;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

/**
 * Gets a user profile by user ID
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }
    return data as UserProfile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Gets a user profile by username
 */
export const getUserProfileByUsername = async (username: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }
    return data as UserProfile;
  } catch (error) {
    console.error("Error fetching user profile by username:", error);
    throw error;
  }
};

/**
 * Updates a user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: UpdateUserProfileData
): Promise<UserProfile> => {
  try {
    const updateData: Record<string, any> = {};

    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Searches for users by username or display name
 */
export const searchUsers = async (query: string, limit: number = 20): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .eq("is_public", true)
      .limit(limit);

    if (error) throw error;
    return data as UserProfile[];
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};

/**
 * Deletes a user profile
 */
export const deleteUserProfile = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("user_profiles")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting user profile:", error);
    throw error;
  }
};

/**
 * Gets profile stats (followers, following, workouts count)
 */
export const getUserStats = async (userId: string) => {
  try {
    // Get followers count
    const { count: followersCount, error: followersError } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    if (followersError) throw followersError;

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (followingError) throw followingError;

    // Get workouts count
    const { count: workoutsCount, error: workoutsError } = await supabase
      .from("workouts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (workoutsError) throw workoutsError;

    return {
      followers: followersCount || 0,
      following: followingCount || 0,
      workouts: workoutsCount || 0,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error;
  }
};

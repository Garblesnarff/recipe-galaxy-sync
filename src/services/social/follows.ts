import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "./userProfiles";

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface UserWithProfile extends UserFollow {
  follower_profile?: UserProfile;
  following_profile?: UserProfile;
}

/**
 * Follow a user
 */
export const followUser = async (followerId: string, followingId: string): Promise<UserFollow> => {
  try {
    // Check if already following
    const { data: existing } = await supabase
      .from("user_follows")
      .select("*")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .single();

    if (existing) {
      return existing as UserFollow;
    }

    const { data, error } = await supabase
      .from("user_follows")
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserFollow;
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) throw error;
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};

/**
 * Get a user's followers with their profiles
 */
export const getFollowers = async (userId: string): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from("user_follows")
      .select(`
        *,
        follower_profile:user_profiles!user_follows_follower_id_fkey(*)
      `)
      .eq("following_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Extract follower profiles
    return (data as any[])
      .map((follow: any) => follow.follower_profile)
      .filter(Boolean) as UserProfile[];
  } catch (error) {
    console.error("Error fetching followers:", error);
    throw error;
  }
};

/**
 * Get users that a user is following with their profiles
 */
export const getFollowing = async (userId: string): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from("user_follows")
      .select(`
        *,
        following_profile:user_profiles!user_follows_following_id_fkey(*)
      `)
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Extract following profiles
    return (data as any[])
      .map((follow: any) => follow.following_profile)
      .filter(Boolean) as UserProfile[];
  } catch (error) {
    console.error("Error fetching following:", error);
    throw error;
  }
};

/**
 * Check if user A is following user B
 */
export const isFollowing = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false; // Not found
      }
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
};

/**
 * Get mutual follows (users who follow each other)
 */
export const getMutualFollows = async (userId: string): Promise<UserProfile[]> => {
  try {
    // Get users that the current user follows
    const following = await getFollowing(userId);
    const followingIds = following.map(profile => profile.user_id);

    if (followingIds.length === 0) {
      return [];
    }

    // From those, find who also follows the current user back
    const { data, error } = await supabase
      .from("user_follows")
      .select(`
        *,
        follower_profile:user_profiles!user_follows_follower_id_fkey(*)
      `)
      .eq("following_id", userId)
      .in("follower_id", followingIds);

    if (error) throw error;

    return (data as any[])
      .map((follow: any) => follow.follower_profile)
      .filter(Boolean) as UserProfile[];
  } catch (error) {
    console.error("Error fetching mutual follows:", error);
    throw error;
  }
};

/**
 * Get suggested users to follow (popular users not currently followed)
 */
export const getSuggestedUsers = async (
  userId: string,
  limit: number = 10
): Promise<UserProfile[]> => {
  try {
    // Get users the current user is already following
    const { data: currentFollowing } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", userId);

    const followingIds = currentFollowing?.map(f => f.following_id) || [];

    // Get public profiles not in following list and not self
    let query = supabase
      .from("user_profiles")
      .select("*")
      .eq("is_public", true)
      .neq("user_id", userId)
      .limit(limit);

    if (followingIds.length > 0) {
      query = query.not("user_id", "in", `(${followingIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as UserProfile[];
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    throw error;
  }
};

/**
 * Bulk check follow status for multiple users
 */
export const checkFollowStatus = async (
  followerId: string,
  userIds: string[]
): Promise<Record<string, boolean>> => {
  try {
    if (userIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", followerId)
      .in("following_id", userIds);

    if (error) throw error;

    const followingSet = new Set(data.map(f => f.following_id));
    const result: Record<string, boolean> = {};

    userIds.forEach(userId => {
      result[userId] = followingSet.has(userId);
    });

    return result;
  } catch (error) {
    console.error("Error checking bulk follow status:", error);
    return {};
  }
};

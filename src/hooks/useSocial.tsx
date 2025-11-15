import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getUserProfile,
  getUserProfileByUsername,
  getUserStats,
  searchUsers,
  type UserProfile,
} from '@/services/social/userProfiles';
import {
  followUser as followUserService,
  unfollowUser as unfollowUserService,
  getFollowers,
  getFollowing,
  isFollowing as checkIsFollowing,
  getSuggestedUsers,
} from '@/services/social/follows';
import {
  getFeed,
  getUserActivity,
  getFeedByType,
  type Activity,
  type ActivityType,
} from '@/services/social/activityFeed';

export function useSocial() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<{ followers: number; following: number; workouts: number } | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current user
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  // Load user profile by username
  const loadUserProfile = useCallback(async (username: string) => {
    setLoading(true);
    setError(null);

    try {
      const userProfile = await getUserProfileByUsername(username);
      setProfile(userProfile);
      return userProfile;
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load user profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user stats
  const loadUserStats = useCallback(async (usernameOrId: string) => {
    try {
      // First try to get profile if it's a username
      let userId = usernameOrId;
      if (!usernameOrId.includes('-')) {
        const userProfile = await getUserProfileByUsername(usernameOrId);
        if (userProfile) {
          userId = userProfile.user_id;
        }
      }

      const userStats = await getUserStats(userId);
      setStats(userStats);
      return userStats;
    } catch (err) {
      console.error('Error loading user stats:', err);
      setError('Failed to load user stats');
    }
  }, []);

  // Load user activity
  const loadUserActivity = useCallback(async (userId: string, limit: number = 50) => {
    setLoading(true);
    setError(null);

    try {
      const userActivities = await getUserActivity(userId, limit);
      setActivities(userActivities);
      return userActivities;
    } catch (err) {
      console.error('Error loading user activity:', err);
      setError('Failed to load user activity');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load feed
  const loadFeed = useCallback(async (limit: number = 50) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const feedData = await getFeed(user.id, limit);
      setFeed(feedData);
      return feedData;
    } catch (err) {
      console.error('Error loading feed:', err);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load feed by type
  const loadFeedByType = useCallback(async (activityType: ActivityType, limit: number = 50) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const feedData = await getFeedByType(user.id, activityType, limit);
      setFeed(feedData);
      return feedData;
    } catch (err) {
      console.error('Error loading feed by type:', err);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load followers
  const loadFollowers = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const followersList = await getFollowers(userId);
      setFollowers(followersList);
      return followersList;
    } catch (err) {
      console.error('Error loading followers:', err);
      setError('Failed to load followers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load following
  const loadFollowing = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const followingList = await getFollowing(userId);
      setFollowing(followingList);
      return followingList;
    } catch (err) {
      console.error('Error loading following:', err);
      setError('Failed to load following');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load suggested users
  const loadSuggestedUsers = useCallback(async (limit: number = 10) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const suggested = await getSuggestedUsers(user.id, limit);
      setSuggestedUsers(suggested);
      return suggested;
    } catch (err) {
      console.error('Error loading suggested users:', err);
      setError('Failed to load suggested users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user workouts
  const loadUserWorkouts = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
      return data || [];
    } catch (err) {
      console.error('Error loading user workouts:', err);
      setError('Failed to load user workouts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if following
  const checkFollowingStatus = useCallback(async (targetUserId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) return false;

      const following = await checkIsFollowing(user.id, targetUserId);
      setIsFollowing(following);
      return following;
    } catch (err) {
      console.error('Error checking follow status:', err);
      return false;
    }
  }, []);

  // Follow user
  const followUser = useCallback(async (targetUserId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      await followUserService(user.id, targetUserId);
      setIsFollowing(true);

      // Update stats
      if (stats) {
        setStats({ ...stats, following: stats.following + 1 });
      }
    } catch (err) {
      console.error('Error following user:', err);
      throw err;
    }
  }, [stats]);

  // Unfollow user
  const unfollowUser = useCallback(async (targetUserId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      await unfollowUserService(user.id, targetUserId);
      setIsFollowing(false);

      // Update stats
      if (stats) {
        setStats({ ...stats, following: Math.max(0, stats.following - 1) });
      }
    } catch (err) {
      console.error('Error unfollowing user:', err);
      throw err;
    }
  }, [stats]);

  // Search users
  const searchForUsers = useCallback(async (query: string, limit: number = 20) => {
    setLoading(true);
    setError(null);

    try {
      const results = await searchUsers(query, limit);
      return results;
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh feed
  const refreshFeed = useCallback(async () => {
    await loadFeed();
  }, [loadFeed]);

  return {
    profile,
    stats,
    activities,
    feed,
    followers,
    following,
    suggestedUsers,
    workouts,
    isFollowing,
    loading,
    error,
    loadUserProfile,
    loadUserStats,
    loadUserActivity,
    loadFeed,
    loadFeedByType,
    loadFollowers,
    loadFollowing,
    loadSuggestedUsers,
    loadUserWorkouts,
    checkFollowingStatus,
    followUser,
    unfollowUser,
    searchForUsers,
    refreshFeed,
  };
}

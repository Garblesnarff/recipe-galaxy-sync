import { supabase } from "@/integrations/supabase/client";

export interface Leaderboard {
  id: string;
  leaderboard_type: 'total_workouts' | 'total_volume' | 'total_calories' | 'current_streak' | 'monthly_workouts';
  time_period: 'all_time' | 'monthly' | 'weekly';
  updated_at: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  leaderboard_id: string;
  user_id: string;
  rank: number;
  value: number;
  user_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface LeaderboardWithEntries extends Leaderboard {
  entries: LeaderboardEntry[];
}

/**
 * Get leaderboard with rankings
 */
export const getLeaderboard = async (
  type: Leaderboard['leaderboard_type'],
  period: Leaderboard['time_period'],
  limit: number = 100
): Promise<LeaderboardWithEntries | null> => {
  try {
    // Get the leaderboard
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('leaderboard_type', type)
      .eq('time_period', period)
      .single();

    if (leaderboardError) throw leaderboardError;
    if (!leaderboard) return null;

    // Get the entries
    const { data: entries, error: entriesError } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('leaderboard_id', leaderboard.id)
      .order('rank', { ascending: true })
      .limit(limit);

    if (entriesError) throw entriesError;

    // Get user profiles
    const userIds = entries?.map(e => e.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    // Combine data
    const enrichedEntries = entries?.map(entry => {
      const profile = profiles?.find(p => p.id === entry.user_id);
      return {
        ...entry,
        user_name: profile?.full_name || 'Anonymous',
        avatar_url: profile?.avatar_url
      };
    }) || [];

    return {
      ...leaderboard,
      entries: enrichedEntries
    };
  } catch (error) {
    console.error("Exception fetching leaderboard:", error);
    throw error;
  }
};

/**
 * Get all leaderboards for a specific period
 */
export const getLeaderboardsByPeriod = async (
  period: Leaderboard['time_period'],
  limit: number = 10
) => {
  try {
    const types: Leaderboard['leaderboard_type'][] = [
      'total_workouts',
      'total_volume',
      'total_calories',
      'current_streak'
    ];

    if (period === 'monthly') {
      types.push('monthly_workouts');
    }

    const leaderboards = await Promise.all(
      types.map(type => getLeaderboard(type, period, limit))
    );

    return leaderboards.filter(l => l !== null);
  } catch (error) {
    console.error("Exception fetching leaderboards by period:", error);
    throw error;
  }
};

/**
 * Get user's rank in a leaderboard
 */
export const getUserRank = async (
  userId: string,
  leaderboardId: string
): Promise<LeaderboardEntry | null> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('leaderboard_id', leaderboardId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .single();

    return {
      ...data,
      user_name: profile?.full_name || 'Anonymous',
      avatar_url: profile?.avatar_url
    };
  } catch (error) {
    console.error("Exception fetching user rank:", error);
    throw error;
  }
};

/**
 * Get users near a user's rank (for context)
 */
export const getNearbyRanks = async (
  userId: string,
  leaderboardId: string,
  range: number = 5
): Promise<LeaderboardEntry[]> => {
  try {
    // First, get the user's rank
    const userEntry = await getUserRank(userId, leaderboardId);
    if (!userEntry) return [];

    const userRank = userEntry.rank;

    // Get entries around the user's rank
    const { data: entries, error } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('leaderboard_id', leaderboardId)
      .gte('rank', Math.max(1, userRank - range))
      .lte('rank', userRank + range)
      .order('rank', { ascending: true });

    if (error) throw error;

    // Get user profiles
    const userIds = entries?.map(e => e.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    // Combine data
    return entries?.map(entry => {
      const profile = profiles?.find(p => p.id === entry.user_id);
      return {
        ...entry,
        user_name: profile?.full_name || 'Anonymous',
        avatar_url: profile?.avatar_url
      };
    }) || [];
  } catch (error) {
    console.error("Exception fetching nearby ranks:", error);
    throw error;
  }
};

/**
 * Calculate workout count for a user
 */
const calculateWorkoutCount = async (
  userId: string,
  period: 'all_time' | 'monthly' | 'weekly'
): Promise<number> => {
  let query = supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const now = new Date();
  if (period === 'weekly') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    query = query.gte('created_at', weekAgo.toISOString());
  } else if (period === 'monthly') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    query = query.gte('created_at', monthStart.toISOString());
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
};

/**
 * Calculate total volume for a user
 */
const calculateTotalVolume = async (
  userId: string,
  period: 'all_time' | 'monthly' | 'weekly'
): Promise<number> => {
  const now = new Date();
  let dateFilter = '';

  if (period === 'weekly') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = ` AND w.created_at >= '${weekAgo.toISOString()}'`;
  } else if (period === 'monthly') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = ` AND w.created_at >= '${monthStart.toISOString()}'`;
  }

  const { data, error } = await supabase.rpc('calculate_user_volume', {
    user_id_param: userId,
    date_filter: dateFilter
  });

  if (error) {
    // Fallback calculation if RPC doesn't exist
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id, created_at')
      .eq('user_id', userId);

    let filteredWorkouts = workouts || [];
    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredWorkouts = filteredWorkouts.filter(w =>
        new Date(w.created_at) >= weekAgo
      );
    } else if (period === 'monthly') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredWorkouts = filteredWorkouts.filter(w =>
        new Date(w.created_at) >= monthStart
      );
    }

    const workoutIds = filteredWorkouts.map(w => w.id);
    if (workoutIds.length === 0) return 0;

    const { data: exercises } = await supabase
      .from('workout_exercises')
      .select('sets, reps, weight_kg')
      .in('workout_id', workoutIds);

    return exercises?.reduce((sum, ex) => {
      const volume = (ex.sets || 0) * (ex.reps || 0) * (ex.weight_kg || 0);
      return sum + volume;
    }, 0) || 0;
  }

  return data || 0;
};

/**
 * Calculate total calories for a user
 */
const calculateTotalCalories = async (
  userId: string,
  period: 'all_time' | 'monthly' | 'weekly'
): Promise<number> => {
  let query = supabase
    .from('workouts')
    .select('total_calories')
    .eq('user_id', userId)
    .not('total_calories', 'is', null);

  const now = new Date();
  if (period === 'weekly') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    query = query.gte('created_at', weekAgo.toISOString());
  } else if (period === 'monthly') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    query = query.gte('created_at', monthStart.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  return data?.reduce((sum, w) => sum + (w.total_calories || 0), 0) || 0;
};

/**
 * Calculate current streak for a user
 */
const calculateCurrentStreak = async (userId: string): Promise<number> => {
  const { data: workouts, error } = await supabase
    .from('workouts')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!workouts || workouts.length === 0) return 0;

  const workoutDates = new Set(
    workouts.map(w => new Date(w.created_at).toISOString().split('T')[0])
  );

  let streak = 0;
  let currentDate = new Date();

  // Check if there's a workout today or yesterday to start the streak
  const today = currentDate.toISOString().split('T')[0];
  currentDate.setDate(currentDate.getDate() - 1);
  const yesterday = currentDate.toISOString().split('T')[0];

  if (!workoutDates.has(today) && !workoutDates.has(yesterday)) {
    return 0;
  }

  // Start from today if there's a workout, otherwise start from yesterday
  currentDate = new Date();
  if (!workoutDates.has(today)) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Count consecutive days
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (workoutDates.has(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Update all leaderboards (should be run as a cron job)
 */
export const updateLeaderboards = async () => {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError) throw usersError;
    if (!users) return;

    const periods: Leaderboard['time_period'][] = ['all_time', 'monthly', 'weekly'];

    for (const period of periods) {
      // Update workout count leaderboard
      await updateWorkoutCountLeaderboard(users.map(u => u.id), period);

      // Update volume leaderboard
      await updateVolumeLeaderboard(users.map(u => u.id), period);

      // Update calories leaderboard
      await updateCaloriesLeaderboard(users.map(u => u.id), period);

      // Update streak leaderboard (only for all_time)
      if (period === 'all_time') {
        await updateStreakLeaderboard(users.map(u => u.id));
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Exception updating leaderboards:", error);
    throw error;
  }
};

/**
 * Update workout count leaderboard
 */
const updateWorkoutCountLeaderboard = async (
  userIds: string[],
  period: 'all_time' | 'monthly' | 'weekly'
) => {
  // Get leaderboard
  const { data: leaderboard } = await supabase
    .from('leaderboards')
    .select('id')
    .eq('leaderboard_type', 'total_workouts')
    .eq('time_period', period)
    .single();

  if (!leaderboard) return;

  // Calculate for each user
  const userStats = await Promise.all(
    userIds.map(async (userId) => ({
      user_id: userId,
      value: await calculateWorkoutCount(userId, period)
    }))
  );

  // Sort and rank
  const sorted = userStats
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value);

  // Clear existing entries
  await supabase
    .from('leaderboard_entries')
    .delete()
    .eq('leaderboard_id', leaderboard.id);

  // Insert new entries
  if (sorted.length > 0) {
    const entries = sorted.map((stat, index) => ({
      leaderboard_id: leaderboard.id,
      user_id: stat.user_id,
      rank: index + 1,
      value: stat.value
    }));

    await supabase.from('leaderboard_entries').insert(entries);
  }

  // Update leaderboard timestamp
  await supabase
    .from('leaderboards')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', leaderboard.id);
};

/**
 * Update volume leaderboard
 */
const updateVolumeLeaderboard = async (
  userIds: string[],
  period: 'all_time' | 'monthly' | 'weekly'
) => {
  const { data: leaderboard } = await supabase
    .from('leaderboards')
    .select('id')
    .eq('leaderboard_type', 'total_volume')
    .eq('time_period', period)
    .single();

  if (!leaderboard) return;

  const userStats = await Promise.all(
    userIds.map(async (userId) => ({
      user_id: userId,
      value: Math.round(await calculateTotalVolume(userId, period))
    }))
  );

  const sorted = userStats
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value);

  await supabase
    .from('leaderboard_entries')
    .delete()
    .eq('leaderboard_id', leaderboard.id);

  if (sorted.length > 0) {
    const entries = sorted.map((stat, index) => ({
      leaderboard_id: leaderboard.id,
      user_id: stat.user_id,
      rank: index + 1,
      value: stat.value
    }));

    await supabase.from('leaderboard_entries').insert(entries);
  }

  await supabase
    .from('leaderboards')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', leaderboard.id);
};

/**
 * Update calories leaderboard
 */
const updateCaloriesLeaderboard = async (
  userIds: string[],
  period: 'all_time' | 'monthly' | 'weekly'
) => {
  const { data: leaderboard } = await supabase
    .from('leaderboards')
    .select('id')
    .eq('leaderboard_type', 'total_calories')
    .eq('time_period', period)
    .single();

  if (!leaderboard) return;

  const userStats = await Promise.all(
    userIds.map(async (userId) => ({
      user_id: userId,
      value: Math.round(await calculateTotalCalories(userId, period))
    }))
  );

  const sorted = userStats
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value);

  await supabase
    .from('leaderboard_entries')
    .delete()
    .eq('leaderboard_id', leaderboard.id);

  if (sorted.length > 0) {
    const entries = sorted.map((stat, index) => ({
      leaderboard_id: leaderboard.id,
      user_id: stat.user_id,
      rank: index + 1,
      value: stat.value
    }));

    await supabase.from('leaderboard_entries').insert(entries);
  }

  await supabase
    .from('leaderboards')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', leaderboard.id);
};

/**
 * Update streak leaderboard
 */
const updateStreakLeaderboard = async (userIds: string[]) => {
  const { data: leaderboard } = await supabase
    .from('leaderboards')
    .select('id')
    .eq('leaderboard_type', 'current_streak')
    .eq('time_period', 'all_time')
    .single();

  if (!leaderboard) return;

  const userStats = await Promise.all(
    userIds.map(async (userId) => ({
      user_id: userId,
      value: await calculateCurrentStreak(userId)
    }))
  );

  const sorted = userStats
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value);

  await supabase
    .from('leaderboard_entries')
    .delete()
    .eq('leaderboard_id', leaderboard.id);

  if (sorted.length > 0) {
    const entries = sorted.map((stat, index) => ({
      leaderboard_id: leaderboard.id,
      user_id: stat.user_id,
      rank: index + 1,
      value: stat.value
    }));

    await supabase.from('leaderboard_entries').insert(entries);
  }

  await supabase
    .from('leaderboards')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', leaderboard.id);
};

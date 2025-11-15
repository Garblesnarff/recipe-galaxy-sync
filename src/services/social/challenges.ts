import { supabase } from "@/integrations/supabase/client";

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  challenge_type: 'workout_count' | 'total_volume' | 'total_calories' | 'streak' | 'specific_exercise';
  goal_value: number;
  start_date: string;
  end_date: string;
  created_by?: string;
  is_global: boolean;
  exercise_name?: string;
  image_url?: string;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  current_progress: number;
  completed: boolean;
  completed_at?: string;
  joined_at: string;
}

export interface ChallengeWithParticipants extends Challenge {
  participant_count: number;
  user_participation?: ChallengeParticipant;
}

export interface ChallengeLeaderboardEntry {
  user_id: string;
  current_progress: number;
  completed: boolean;
  user_name?: string;
  avatar_url?: string;
  rank: number;
}

export type ChallengeFilter = 'active' | 'upcoming' | 'completed' | 'my_challenges';

/**
 * Fetches challenges with optional filtering
 */
export const getChallenges = async (
  userId?: string,
  filter: ChallengeFilter = 'active'
) => {
  try {
    const now = new Date().toISOString().split('T')[0];

    let query = supabase.from("challenges").select(`
      *,
      participants:challenge_participants(count)
    `);

    // Apply filter
    switch (filter) {
      case 'active':
        query = query
          .lte('start_date', now)
          .gte('end_date', now);
        break;
      case 'upcoming':
        query = query.gt('start_date', now);
        break;
      case 'completed':
        query = query.lt('end_date', now);
        break;
      case 'my_challenges':
        if (!userId) throw new Error('User ID required for my_challenges filter');
        query = query.eq('created_by', userId);
        break;
    }

    query = query.order('start_date', { ascending: false });

    const { data: challenges, error } = await query;
    if (error) throw error;

    // If user is logged in, get their participation status
    if (userId) {
      const challengeIds = challenges?.map((c: any) => c.id) || [];
      const { data: participations } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('user_id', userId)
        .in('challenge_id', challengeIds);

      return challenges?.map((challenge: any) => ({
        ...challenge,
        participant_count: challenge.participants?.[0]?.count || 0,
        user_participation: participations?.find(p => p.challenge_id === challenge.id)
      })) || [];
    }

    return challenges?.map((challenge: any) => ({
      ...challenge,
      participant_count: challenge.participants?.[0]?.count || 0
    })) || [];
  } catch (error) {
    console.error("Exception fetching challenges:", error);
    throw error;
  }
};

/**
 * Fetches a single challenge with detailed information
 */
export const getChallengeDetail = async (
  challengeId: string,
  userId?: string
) => {
  try {
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select(`
        *,
        participants:challenge_participants(count)
      `)
      .eq('id', challengeId)
      .single();

    if (challengeError) throw challengeError;

    let userParticipation = null;
    if (userId) {
      const { data } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .maybeSingle();

      userParticipation = data;
    }

    return {
      ...challenge,
      participant_count: challenge.participants?.[0]?.count || 0,
      user_participation: userParticipation
    };
  } catch (error) {
    console.error("Exception fetching challenge detail:", error);
    throw error;
  }
};

/**
 * Join a challenge
 */
export const joinChallenge = async (userId: string, challengeId: string) => {
  try {
    const { data, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        current_progress: 0,
        completed: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Exception joining challenge:", error);
    throw error;
  }
};

/**
 * Leave a challenge
 */
export const leaveChallenge = async (userId: string, challengeId: string) => {
  try {
    const { error } = await supabase
      .from('challenge_participants')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Exception leaving challenge:", error);
    throw error;
  }
};

/**
 * Update challenge progress manually
 * Note: Most progress updates happen automatically via database triggers
 */
export const updateChallengeProgress = async (
  userId: string,
  challengeId: string,
  progress: number
) => {
  try {
    const { data: challenge } = await supabase
      .from('challenges')
      .select('goal_value')
      .eq('id', challengeId)
      .single();

    const completed = challenge ? progress >= challenge.goal_value : false;

    const { data, error } = await supabase
      .from('challenge_participants')
      .update({
        current_progress: progress,
        completed: completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Exception updating challenge progress:", error);
    throw error;
  }
};

/**
 * Get challenge leaderboard
 */
export const getChallengeLeaderboard = async (
  challengeId: string,
  limit: number = 100
): Promise<ChallengeLeaderboardEntry[]> => {
  try {
    const { data: participants, error } = await supabase
      .from('challenge_participants')
      .select(`
        user_id,
        current_progress,
        completed,
        completed_at
      `)
      .eq('challenge_id', challengeId)
      .order('current_progress', { ascending: false })
      .order('completed_at', { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error) throw error;

    // Get user profiles for the participants
    const userIds = participants?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    // Combine data and add rankings
    const leaderboard = participants?.map((participant, index) => {
      const profile = profiles?.find(p => p.id === participant.user_id);
      return {
        ...participant,
        user_name: profile?.full_name || 'Anonymous',
        avatar_url: profile?.avatar_url,
        rank: index + 1
      };
    }) || [];

    return leaderboard;
  } catch (error) {
    console.error("Exception fetching challenge leaderboard:", error);
    throw error;
  }
};

/**
 * Create a custom challenge
 */
export const createChallenge = async (
  userId: string,
  challengeData: {
    title: string;
    description?: string;
    challenge_type: Challenge['challenge_type'];
    goal_value: number;
    start_date: string;
    end_date: string;
    exercise_name?: string;
    image_url?: string;
  }
) => {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .insert({
        ...challengeData,
        created_by: userId,
        is_global: false
      })
      .select()
      .single();

    if (error) throw error;

    // Automatically join the challenge
    await joinChallenge(userId, data.id);

    return data;
  } catch (error) {
    console.error("Exception creating challenge:", error);
    throw error;
  }
};

/**
 * Get user's active challenges
 */
export const getUserActiveChallenges = async (userId: string) => {
  try {
    const now = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('challenge_participants')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .eq('user_id', userId)
      .eq('completed', false)
      .lte('challenge.start_date', now)
      .gte('challenge.end_date', now);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Exception fetching user active challenges:", error);
    throw error;
  }
};

/**
 * Get challenge statistics
 */
export const getChallengeStats = async (challengeId: string) => {
  try {
    const { data, error } = await supabase
      .from('challenge_participants')
      .select('current_progress, completed')
      .eq('challenge_id', challengeId);

    if (error) throw error;

    const total = data?.length || 0;
    const completed = data?.filter(p => p.completed).length || 0;
    const inProgress = total - completed;
    const avgProgress = total > 0
      ? data.reduce((sum, p) => sum + p.current_progress, 0) / total
      : 0;

    return {
      total_participants: total,
      completed_count: completed,
      in_progress_count: inProgress,
      average_progress: Math.round(avgProgress),
      completion_rate: total > 0 ? (completed / total) * 100 : 0
    };
  } catch (error) {
    console.error("Exception fetching challenge stats:", error);
    throw error;
  }
};

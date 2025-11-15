import { supabase } from '@/lib/supabase';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  requirement_metadata?: any;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  created_at: string;
  achievement?: Achievement;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_workouts: number;
  total_minutes: number;
  total_calories: number;
  current_streak_days: number;
  longest_streak_days: number;
  total_prs: number;
  level: number;
  total_points: number;
  last_workout_date: string | null;
  updated_at: string;
  created_at: string;
}

export interface AchievementProgress {
  achievement: Achievement;
  earned: boolean;
  progress: number;
  current_value: number;
  earned_at?: string;
}

/**
 * Calculate user level based on total points
 * Uses a progressive scaling: Level = floor(sqrt(points / 100))
 */
export function calculateLevel(totalPoints: number): number {
  if (totalPoints <= 0) return 1;
  return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
}

/**
 * Calculate points needed for next level
 */
export function getPointsForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  return (nextLevel - 1) ** 2 * 100;
}

/**
 * Calculate progress to next level (0-100)
 */
export function getLevelProgress(totalPoints: number): number {
  const currentLevel = calculateLevel(totalPoints);
  const currentLevelPoints = (currentLevel - 1) ** 2 * 100;
  const nextLevelPoints = currentLevel ** 2 * 100;
  const progressPoints = totalPoints - currentLevelPoints;
  const pointsNeeded = nextLevelPoints - currentLevelPoints;
  return Math.min(100, Math.max(0, (progressPoints / pointsNeeded) * 100));
}

/**
 * Get or create user stats
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No stats yet, create them
      const { data: newStats, error: insertError } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          total_workouts: 0,
          total_minutes: 0,
          total_calories: 0,
          current_streak_days: 0,
          longest_streak_days: 0,
          total_prs: 0,
          level: 1,
          total_points: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return newStats;
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

/**
 * Update user stats after a workout
 */
export async function updateUserStats(
  userId: string,
  workoutData: {
    duration_minutes?: number;
    calories_burned?: number;
    is_pr?: boolean;
  }
): Promise<UserStats | null> {
  try {
    // Get current stats
    const stats = await getUserStats(userId);
    if (!stats) return null;

    // Calculate new streak
    const today = new Date().toISOString().split('T')[0];
    const lastWorkoutDate = stats.last_workout_date;
    let newStreak = stats.current_streak_days;

    if (!lastWorkoutDate) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastWorkoutDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        // Same day, keep streak
        newStreak = stats.current_streak_days;
      } else if (diffDays === 1) {
        // Consecutive day, increment
        newStreak = stats.current_streak_days + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    // Update stats
    const { data, error } = await supabase
      .from('user_stats')
      .update({
        total_workouts: stats.total_workouts + 1,
        total_minutes: stats.total_minutes + (workoutData.duration_minutes || 0),
        total_calories: stats.total_calories + (workoutData.calories_burned || 0),
        current_streak_days: newStreak,
        longest_streak_days: Math.max(stats.longest_streak_days, newStreak),
        total_prs: stats.total_prs + (workoutData.is_pr ? 1 : 0),
        last_workout_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user stats:', error);
    return null;
  }
}

/**
 * Award points to a user
 */
export async function awardPoints(
  userId: string,
  points: number,
  reason?: string
): Promise<boolean> {
  try {
    const stats = await getUserStats(userId);
    if (!stats) return false;

    const newTotalPoints = stats.total_points + points;
    const newLevel = calculateLevel(newTotalPoints);

    const { error } = await supabase
      .from('user_stats')
      .update({
        total_points: newTotalPoints,
        level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;

    console.log(`Awarded ${points} points to user ${userId}. Reason: ${reason || 'N/A'}`);
    return true;
  } catch (error) {
    console.error('Error awarding points:', error);
    return false;
  }
}

/**
 * Get all achievements
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('tier', { ascending: true })
      .order('points', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }
}

/**
 * Get user's earned achievements
 */
export async function getEarnedAchievements(
  userId: string
): Promise<UserAchievement[]> {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(
        `
        *,
        achievement:achievements(*)
      `
      )
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching earned achievements:', error);
    return [];
  }
}

/**
 * Get available achievements with progress
 */
export async function getAvailableAchievements(
  userId: string
): Promise<AchievementProgress[]> {
  try {
    const [allAchievements, earnedAchievements, stats] = await Promise.all([
      getAllAchievements(),
      getEarnedAchievements(userId),
      getUserStats(userId),
    ]);

    if (!stats) return [];

    const earnedIds = new Set(earnedAchievements.map((ua) => ua.achievement_id));

    return allAchievements.map((achievement) => {
      const earned = earnedIds.has(achievement.id);
      const earnedAchievement = earnedAchievements.find(
        (ua) => ua.achievement_id === achievement.id
      );

      let currentValue = 0;
      switch (achievement.requirement_type) {
        case 'workout_count':
          currentValue = stats.total_workouts;
          break;
        case 'streak_days':
          currentValue = stats.current_streak_days;
          break;
        case 'calories_burned':
          currentValue = stats.total_calories;
          break;
        case 'pr_count':
          currentValue = stats.total_prs;
          break;
        case 'total_minutes':
          currentValue = stats.total_minutes;
          break;
        default:
          currentValue = 0;
      }

      const progress = Math.min(
        100,
        (currentValue / achievement.requirement_value) * 100
      );

      return {
        achievement,
        earned,
        progress,
        current_value: currentValue,
        earned_at: earnedAchievement?.earned_at,
      };
    });
  } catch (error) {
    console.error('Error getting available achievements:', error);
    return [];
  }
}

/**
 * Check and award new achievements
 */
export async function checkAchievements(
  userId: string
): Promise<Achievement[]> {
  try {
    const stats = await getUserStats(userId);
    if (!stats) return [];

    const [allAchievements, earnedAchievements] = await Promise.all([
      getAllAchievements(),
      getEarnedAchievements(userId),
    ]);

    const earnedIds = new Set(earnedAchievements.map((ua) => ua.achievement_id));
    const newlyEarned: Achievement[] = [];

    for (const achievement of allAchievements) {
      // Skip if already earned
      if (earnedIds.has(achievement.id)) continue;

      let isEarned = false;

      // Check if requirement is met
      switch (achievement.requirement_type) {
        case 'workout_count':
          isEarned = stats.total_workouts >= achievement.requirement_value;
          break;
        case 'streak_days':
          isEarned = stats.current_streak_days >= achievement.requirement_value;
          break;
        case 'calories_burned':
          isEarned = stats.total_calories >= achievement.requirement_value;
          break;
        case 'pr_count':
          isEarned = stats.total_prs >= achievement.requirement_value;
          break;
        case 'total_minutes':
          isEarned = stats.total_minutes >= achievement.requirement_value;
          break;
        // Add more complex requirements here
        default:
          isEarned = false;
      }

      if (isEarned) {
        // Award the achievement
        const { error } = await supabase.from('user_achievements').insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

        if (!error) {
          // Award points
          await awardPoints(userId, achievement.points, `Achievement: ${achievement.name}`);
          newlyEarned.push(achievement);
        }
      }
    }

    return newlyEarned;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

/**
 * Get current streak information
 */
export async function getCurrentStreak(userId: string): Promise<{
  current: number;
  longest: number;
  lastWorkoutDate: string | null;
}> {
  try {
    const stats = await getUserStats(userId);
    if (!stats) {
      return { current: 0, longest: 0, lastWorkoutDate: null };
    }

    return {
      current: stats.current_streak_days,
      longest: stats.longest_streak_days,
      lastWorkoutDate: stats.last_workout_date,
    };
  } catch (error) {
    console.error('Error getting streak:', error);
    return { current: 0, longest: 0, lastWorkoutDate: null };
  }
}

/**
 * Get recent workout dates for calendar display
 */
export async function getWorkoutCalendar(
  userId: string,
  daysBack: number = 30
): Promise<string[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data, error } = await supabase
      .from('workouts')
      .select('workout_date')
      .eq('user_id', userId)
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .order('workout_date', { ascending: false });

    if (error) throw error;

    // Return unique dates
    return [...new Set(data.map((w) => w.workout_date))];
  } catch (error) {
    console.error('Error getting workout calendar:', error);
    return [];
  }
}

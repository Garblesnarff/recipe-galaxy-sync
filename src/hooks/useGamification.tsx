import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserStats,
  getAvailableAchievements,
  getWorkoutCalendar,
  checkAchievements,
  UserStats,
  AchievementProgress,
  Achievement,
} from '@/services/workout/gamification';

export function useGamification() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user stats
  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await getUserStats(user.id);
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load user stats');
    }
  }, [user?.id]);

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await getAvailableAchievements(user.id);
      setAchievements(data);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to load achievements');
    }
  }, [user?.id]);

  // Fetch workout calendar
  const fetchWorkoutCalendar = useCallback(async () => {
    if (!user?.id) return;

    try {
      const dates = await getWorkoutCalendar(user.id, 30);
      setWorkoutDates(dates);
    } catch (err) {
      console.error('Error fetching workout calendar:', err);
    }
  }, [user?.id]);

  // Check for new achievements
  const checkForNewAchievements = useCallback(async (): Promise<Achievement[]> => {
    if (!user?.id) return [];

    try {
      const newAchievements = await checkAchievements(user.id);
      if (newAchievements.length > 0) {
        // Refresh data
        await Promise.all([fetchStats(), fetchAchievements()]);
      }
      return newAchievements;
    } catch (err) {
      console.error('Error checking achievements:', err);
      return [];
    }
  }, [user?.id, fetchStats, fetchAchievements]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchStats(),
        fetchAchievements(),
        fetchWorkoutCalendar(),
      ]);
    } catch (err) {
      console.error('Error refreshing gamification data:', err);
      setError('Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchAchievements, fetchWorkoutCalendar]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      refresh();
    }
  }, [user?.id]);

  return {
    stats,
    achievements,
    workoutDates,
    loading,
    error,
    refresh,
    checkForNewAchievements,
  };
}

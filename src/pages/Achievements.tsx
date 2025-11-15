import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LevelSystem } from '@/components/workout/LevelSystem';
import { StreakWidget } from '@/components/workout/StreakWidget';
import { AchievementsGrid } from '@/components/workout/AchievementsGrid';
import { useGamification } from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Zap, Award, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Achievements() {
  const { stats, achievements, workoutDates, loading, refresh } = useGamification();

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  const earnedAchievements = achievements.filter((a) => a.earned);
  const totalPoints = stats?.total_points || 0;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Achievements
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your fitness journey and unlock rewards
            </p>
          </div>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {earnedAchievements.length}
                <span className="text-lg text-muted-foreground ml-1">
                  / {achievements.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((earnedAchievements.length / achievements.length) * 100)}% complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Total XP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {totalPoints.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Experience points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stats?.current_streak_days || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.current_streak_days === 1 ? 'day' : 'days'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.total_workouts || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Level & Streak */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LevelSystem totalPoints={totalPoints} />
          <StreakWidget
            currentStreak={stats?.current_streak_days || 0}
            longestStreak={stats?.longest_streak_days || 0}
            workoutDates={workoutDates}
          />
        </div>

        {/* Additional Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fitness Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.total_minutes || 0}
                </div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats?.total_calories || 0}
                </div>
                <div className="text-sm text-muted-foreground">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats?.total_prs || 0}
                </div>
                <div className="text-sm text-muted-foreground">PRs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats?.longest_streak_days || 0}
                </div>
                <div className="text-sm text-muted-foreground">Best Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">All Achievements</h2>
          <AchievementsGrid achievements={achievements} />
        </div>
      </div>
    </MainLayout>
  );
}

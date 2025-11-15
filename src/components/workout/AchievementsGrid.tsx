import React, { useState, useMemo } from 'react';
import { AchievementBadge } from './AchievementBadge';
import { AchievementProgress } from '@/services/workout/gamification';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Trophy, Lock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementsGridProps {
  achievements: AchievementProgress[];
  className?: string;
}

type FilterType = 'all' | 'earned' | 'locked' | 'in-progress';
type SortType = 'tier' | 'date' | 'progress' | 'points';

export function AchievementsGrid({ achievements, className }: AchievementsGridProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('tier');
  const [searchQuery, setSearchQuery] = useState('');

  // Count achievements by category
  const counts = useMemo(() => {
    return {
      all: achievements.length,
      earned: achievements.filter((a) => a.earned).length,
      locked: achievements.filter((a) => !a.earned && a.progress === 0).length,
      inProgress: achievements.filter((a) => !a.earned && a.progress > 0).length,
    };
  }, [achievements]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    let filtered = achievements;

    // Apply filter
    switch (filter) {
      case 'earned':
        filtered = filtered.filter((a) => a.earned);
        break;
      case 'locked':
        filtered = filtered.filter((a) => !a.earned && a.progress === 0);
        break;
      case 'in-progress':
        filtered = filtered.filter((a) => !a.earned && a.progress > 0);
        break;
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort
    switch (sort) {
      case 'tier':
        const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
        filtered = [...filtered].sort((a, b) => {
          const tierDiff =
            tierOrder[b.achievement.tier] - tierOrder[a.achievement.tier];
          if (tierDiff !== 0) return tierDiff;
          return b.achievement.points - a.achievement.points;
        });
        break;
      case 'date':
        filtered = [...filtered].sort((a, b) => {
          if (a.earned && b.earned) {
            return (
              new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime()
            );
          }
          if (a.earned) return -1;
          if (b.earned) return 1;
          return 0;
        });
        break;
      case 'progress':
        filtered = [...filtered].sort((a, b) => b.progress - a.progress);
        break;
      case 'points':
        filtered = [...filtered].sort(
          (a, b) => b.achievement.points - a.achievement.points
        );
        break;
    }

    return filtered;
  }, [achievements, filter, sort, searchQuery]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {counts.earned}
              </div>
              <div className="text-xs text-muted-foreground">Earned</div>
            </div>
            <Trophy className="h-8 w-8 text-purple-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {counts.inProgress}
              </div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <Star className="h-8 w-8 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-400">
                {counts.locked}
              </div>
              <div className="text-xs text-muted-foreground">Locked</div>
            </div>
            <Lock className="h-8 w-8 text-gray-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-3 border border-green-100 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {Math.round((counts.earned / counts.all) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Filter Tabs */}
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as FilterType)}
          className="flex-1"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="earned" className="text-xs">
              Earned ({counts.earned})
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="text-xs">
              Progress ({counts.inProgress})
            </TabsTrigger>
            <TabsTrigger value="locked" className="text-xs">
              Locked ({counts.locked})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tier">Tier</SelectItem>
            <SelectItem value="date">Date Earned</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
            <SelectItem value="points">Points</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search achievements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-12">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-lg font-semibold mb-1">No achievements found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'Try a different search query'
              : 'Start working out to unlock achievements!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.achievement.id}
              achievement={achievement.achievement}
              earned={achievement.earned}
              progress={achievement.progress}
              currentValue={achievement.current_value}
              earnedAt={achievement.earned_at}
              showProgress={!achievement.earned}
            />
          ))}
        </div>
      )}
    </div>
  );
}

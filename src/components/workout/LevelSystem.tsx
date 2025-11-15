import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, Star, Award, Crown } from 'lucide-react';
import {
  calculateLevel,
  getPointsForNextLevel,
  getLevelProgress,
} from '@/services/workout/gamification';
import { cn } from '@/lib/utils';

interface LevelSystemProps {
  totalPoints: number;
  className?: string;
  compact?: boolean;
}

// Level tier thresholds and colors
const levelTiers = [
  { min: 1, max: 4, name: 'Beginner', color: 'text-gray-600 dark:text-gray-400', icon: Zap },
  { min: 5, max: 9, name: 'Intermediate', color: 'text-blue-600 dark:text-blue-400', icon: Star },
  { min: 10, max: 19, name: 'Advanced', color: 'text-purple-600 dark:text-purple-400', icon: Award },
  { min: 20, max: Infinity, name: 'Elite', color: 'text-yellow-600 dark:text-yellow-400', icon: Crown },
];

function getLevelTier(level: number) {
  return levelTiers.find((tier) => level >= tier.min && level <= tier.max) || levelTiers[0];
}

export function LevelSystem({ totalPoints, className, compact = false }: LevelSystemProps) {
  const currentLevel = calculateLevel(totalPoints);
  const progress = getLevelProgress(totalPoints);
  const nextLevelPoints = getPointsForNextLevel(currentLevel);
  const currentLevelPoints = (currentLevel - 1) ** 2 * 100;
  const pointsToNextLevel = nextLevelPoints - totalPoints;

  const tier = getLevelTier(currentLevel);
  const TierIcon = tier.icon;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {/* Level Badge */}
        <div className="relative">
          <div
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg',
              'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg',
              'ring-2 ring-purple-200 dark:ring-purple-800'
            )}
          >
            {currentLevel}
          </div>
          <div className="absolute -bottom-1 -right-1">
            <TierIcon className={cn('h-5 w-5', tier.color)} />
          </div>
        </div>

        {/* Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold">Level {currentLevel}</span>
            <span className="text-xs text-muted-foreground">
              {totalPoints} XP
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <TierIcon className={cn('h-5 w-5', tier.color)} />
            Your Level
          </span>
          <Badge variant="outline" className={cn('text-xs capitalize', tier.color)}>
            {tier.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level Display */}
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-50 rounded-full" />

            {/* Level circle */}
            <div className="relative">
              <div
                className={cn(
                  'h-24 w-24 rounded-full flex flex-col items-center justify-center',
                  'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600',
                  'text-white shadow-xl',
                  'ring-4 ring-purple-200 dark:ring-purple-800'
                )}
              >
                <span className="text-3xl font-bold">{currentLevel}</span>
                <span className="text-xs opacity-90">LEVEL</span>
              </div>

              {/* Tier Icon */}
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg">
                <TierIcon className={cn('h-6 w-6', tier.color)} />
              </div>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Experience Points</span>
            <span className="text-muted-foreground">
              {totalPoints} / {nextLevelPoints} XP
            </span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-3" />
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
              style={{
                backgroundSize: '200% 100%',
              }}
            />
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {pointsToNextLevel} XP to Level {currentLevel + 1}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalPoints}
            </div>
            <div className="text-xs text-muted-foreground">Total XP</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              {currentLevel}
            </div>
            <div className="text-xs text-muted-foreground">Level</div>
          </div>
        </div>

        {/* Next Tier Info */}
        {currentLevel < 20 && (
          <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
            {currentLevel < 5
              ? `Reach level 5 to become Intermediate`
              : currentLevel < 10
              ? `Reach level 10 to become Advanced`
              : `Reach level 20 to become Elite`}
          </div>
        )}
      </CardContent>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </Card>
  );
}

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { Achievement } from '@/services/workout/gamification';
import { cn } from '@/lib/utils';

interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: boolean;
  progress?: number;
  currentValue?: number;
  earnedAt?: string;
  className?: string;
  showProgress?: boolean;
}

const tierColors = {
  bronze: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
  },
  silver: {
    bg: 'bg-slate-50 dark:bg-slate-950/20',
    border: 'border-slate-300 dark:border-slate-700',
    text: 'text-slate-700 dark:text-slate-400',
    badge: 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200',
  },
  gold: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-700 dark:text-yellow-400',
    badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  },
  platinum: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-400',
    badge: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  },
};

export function AchievementBadge({
  achievement,
  earned = false,
  progress = 0,
  currentValue = 0,
  earnedAt,
  className,
  showProgress = true,
}: AchievementBadgeProps) {
  const tierColor = tierColors[achievement.tier] || tierColors.bronze;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-md',
        earned ? tierColor.bg : 'bg-gray-50 dark:bg-gray-900/20',
        earned ? tierColor.border : 'border-gray-200 dark:border-gray-800',
        !earned && 'opacity-60',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full text-2xl',
              earned ? tierColor.bg : 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            {earned ? (
              achievement.icon
            ) : (
              <Lock className="h-5 w-5 text-gray-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4
                  className={cn(
                    'font-semibold text-sm',
                    earned
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {achievement.name}
                </h4>
                <p
                  className={cn(
                    'text-xs mt-1',
                    earned
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {achievement.description}
                </p>
              </div>

              {/* Tier Badge */}
              <Badge className={cn('text-xs capitalize', tierColor.badge)}>
                {achievement.tier}
              </Badge>
            </div>

            {/* Progress Bar */}
            {!earned && showProgress && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {currentValue} / {achievement.requirement_value}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            {/* Points & Date */}
            <div className="flex items-center justify-between mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  earned ? tierColor.text : 'text-gray-400 dark:text-gray-500'
                )}
              >
                {achievement.points} points
              </span>
              {earned && earnedAt && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(earnedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Shine effect for earned achievements */}
      {earned && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine pointer-events-none" />
      )}
    </Card>
  );
}

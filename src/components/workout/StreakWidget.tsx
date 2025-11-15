import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  workoutDates?: string[];
  className?: string;
}

const motivationalMessages = [
  { min: 0, max: 0, message: "Start your streak today!", emoji: "💪" },
  { min: 1, max: 2, message: "Great start!", emoji: "🌱" },
  { min: 3, max: 6, message: "You're building momentum!", emoji: "🔥" },
  { min: 7, max: 13, message: "Week warrior!", emoji: "⚡" },
  { min: 14, max: 29, message: "Unstoppable!", emoji: "🚀" },
  { min: 30, max: 99, message: "You're legendary!", emoji: "👑" },
  { min: 100, max: Infinity, message: "Hall of Fame!", emoji: "🏆" },
];

function getMotivationalMessage(streak: number) {
  const msg = motivationalMessages.find(
    (m) => streak >= m.min && streak <= m.max
  );
  return msg || motivationalMessages[0];
}

// Mini calendar showing last 7 days
function StreakCalendar({ workoutDates = [] }: { workoutDates: string[] }) {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const workoutDateSet = new Set(
    workoutDates.map((d) => new Date(d).toISOString().split('T')[0])
  );

  return (
    <div className="flex gap-1.5 justify-center">
      {last7Days.map((date, index) => {
        const dateStr = date.toISOString().split('T')[0];
        const hasWorkout = workoutDateSet.has(dateStr);
        const isToday = dateStr === today.toISOString().split('T')[0];

        return (
          <div
            key={index}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-xs text-muted-foreground">
              {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
            </span>
            <div
              className={cn(
                'h-8 w-8 rounded-md flex items-center justify-center transition-all',
                hasWorkout
                  ? 'bg-orange-500 dark:bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-300',
                isToday && 'ring-2 ring-orange-400 ring-offset-2'
              )}
              title={
                hasWorkout
                  ? `Workout on ${date.toLocaleDateString()}`
                  : `No workout on ${date.toLocaleDateString()}`
              }
            >
              {hasWorkout && <Flame className="h-4 w-4" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StreakWidget({
  currentStreak,
  longestStreak,
  workoutDates = [],
  className,
}: StreakWidgetProps) {
  const message = getMotivationalMessage(currentStreak);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Workout Streak
          </span>
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Last 7 days
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            {/* Glow effect */}
            {currentStreak > 0 && (
              <div className="absolute inset-0 blur-2xl bg-orange-500/30 rounded-full animate-pulse" />
            )}
            {/* Streak number */}
            <div className="relative">
              <span className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                {currentStreak}
              </span>
              <span className="text-2xl text-muted-foreground ml-2">
                {currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>

          {/* Motivational message */}
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="text-xl">{message.emoji}</span>
            <span>{message.message}</span>
          </div>
        </div>

        {/* Calendar */}
        <StreakCalendar workoutDates={workoutDates} />

        {/* Longest Streak */}
        {longestStreak > currentStreak && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Personal Best
              </span>
              <span className="font-semibold">
                {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        )}

        {/* Next milestone */}
        {currentStreak > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-center text-muted-foreground">
              {currentStreak < 7
                ? `${7 - currentStreak} more days to Week Warrior!`
                : currentStreak < 30
                ? `${30 - currentStreak} more days to Monthly Master!`
                : currentStreak < 100
                ? `${100 - currentStreak} more days to Hundred Days Strong!`
                : "You're crushing it! 🔥"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, TrendingUp, Flame, Activity, Zap } from "lucide-react";
import type { LeaderboardEntry, Leaderboard } from "@/services/social/leaderboards";

interface LeaderboardTableProps {
  leaderboardType: Leaderboard['leaderboard_type'];
  timePeriod: Leaderboard['time_period'];
  entries: LeaderboardEntry[];
  currentUserId?: string;
  onTimePeriodChange?: (period: Leaderboard['time_period']) => void;
  showPagination?: boolean;
}

const LeaderboardTable = ({
  leaderboardType,
  timePeriod,
  entries,
  currentUserId,
  onTimePeriodChange,
  showPagination = true
}: LeaderboardTableProps) => {
  const [displayCount, setDisplayCount] = useState(10);

  const getTypeIcon = () => {
    switch (leaderboardType) {
      case 'total_workouts':
      case 'monthly_workouts':
        return <Activity className="h-5 w-5" />;
      case 'total_volume':
        return <TrendingUp className="h-5 w-5" />;
      case 'total_calories':
        return <Flame className="h-5 w-5" />;
      case 'current_streak':
        return <Zap className="h-5 w-5" />;
      default:
        return <Trophy className="h-5 w-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (leaderboardType) {
      case 'total_workouts':
        return 'Total Workouts';
      case 'monthly_workouts':
        return 'Monthly Workouts';
      case 'total_volume':
        return 'Total Volume';
      case 'total_calories':
        return 'Total Calories';
      case 'current_streak':
        return 'Current Streak';
      default:
        return 'Leaderboard';
    }
  };

  const getValueLabel = (value: number) => {
    switch (leaderboardType) {
      case 'total_workouts':
      case 'monthly_workouts':
        return `${value} workouts`;
      case 'total_volume':
        return `${value.toLocaleString()} kg`;
      case 'total_calories':
        return `${value.toLocaleString()} cal`;
      case 'current_streak':
        return `${value} days`;
      default:
        return value.toString();
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return null;
    }
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300";
      case 3:
        return "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300";
      default:
        return "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayEntries = entries.slice(0, displayCount);
  const hasMore = entries.length > displayCount;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          {getTypeIcon()}
          <h2 className="text-2xl font-bold">{getTypeLabel()}</h2>
        </div>

        {/* Time period tabs */}
        {onTimePeriodChange && (
          <Tabs value={timePeriod} onValueChange={(v) => onTimePeriodChange(v as Leaderboard['time_period'])}>
            <TabsList className="bg-white/20">
              <TabsTrigger value="weekly" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                Monthly
              </TabsTrigger>
              <TabsTrigger value="all_time" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                All Time
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Leaderboard entries */}
      <div className="divide-y">
        {displayEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No data yet. Start working out to appear on the leaderboard!</p>
          </div>
        ) : (
          displayEntries.map((entry) => {
            const isCurrentUser = currentUserId === entry.user_id;
            const rankColor = getMedalColor(entry.rank);

            return (
              <div
                key={entry.id}
                className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                  isCurrentUser ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                } ${rankColor ? `${rankColor} border-y` : ""}`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-16 text-center">
                  {getMedalIcon(entry.rank) || (
                    <span className="text-xl font-bold text-gray-600">
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={entry.avatar_url} alt={entry.user_name} />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getInitials(entry.user_name || 'User')}
                  </AvatarFallback>
                </Avatar>

                {/* User name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 truncate">
                      {entry.user_name || 'Anonymous'}
                    </span>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {getValueLabel(entry.value)}
                  </p>
                </div>

                {/* Value */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {entry.value.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {showPagination && hasMore && (
        <div className="p-4 bg-gray-50 text-center border-t">
          <Button
            variant="outline"
            onClick={() => setDisplayCount(prev => prev + 10)}
          >
            View More
          </Button>
        </div>
      )}
    </Card>
  );
};

export { LeaderboardTable };

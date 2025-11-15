import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Award } from "lucide-react";
import type { ChallengeLeaderboardEntry } from "@/services/social/challenges";

interface ChallengeLeaderboardProps {
  entries: ChallengeLeaderboardEntry[];
  goalValue: number;
  currentUserId?: string;
  maxEntries?: number;
}

const ChallengeLeaderboard = ({
  entries,
  goalValue,
  currentUserId,
  maxEntries = 10
}: ChallengeLeaderboardProps) => {
  const displayEntries = entries.slice(0, maxEntries);

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
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

  const progressPercentage = (value: number) => {
    return Math.min(100, (value / goalValue) * 100);
  };

  if (displayEntries.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No participants yet. Be the first to join!</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {displayEntries.map((entry) => {
        const isCurrentUser = currentUserId === entry.user_id;
        const rankColor = getMedalColor(entry.rank);

        return (
          <Card
            key={entry.user_id}
            className={`p-4 transition-all ${
              isCurrentUser
                ? "border-2 border-blue-500 shadow-md"
                : rankColor
                ? `${rankColor} border`
                : ""
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-12 text-center">
                {getMedalIcon(entry.rank) || (
                  <span className="text-lg font-bold text-gray-600">
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

              {/* User info and progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm truncate">
                    {entry.user_name || 'Anonymous'}
                  </span>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                  {entry.completed && (
                    <Badge className="bg-green-500 text-white text-xs">
                      Completed
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Progress</span>
                    <span className="font-semibold">
                      {entry.current_progress.toLocaleString()} / {goalValue.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={progressPercentage(entry.current_progress)}
                    className="h-1.5"
                  />
                </div>
              </div>

              {/* Value */}
              <div className="flex-shrink-0 text-right">
                <div className="text-xl font-bold text-gray-900">
                  {entry.current_progress.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {progressPercentage(entry.current_progress).toFixed(0)}%
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export { ChallengeLeaderboard };

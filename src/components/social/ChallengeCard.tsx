import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { memo } from "react";
import { Trophy, Users, Calendar, Target, TrendingUp, Flame, Zap, Activity } from "lucide-react";
import type { ChallengeWithParticipants } from "@/services/social/challenges";

interface ChallengeCardProps {
  challenge: ChallengeWithParticipants;
  onJoin?: () => void;
  onLeave?: () => void;
  isLoading?: boolean;
}

const ChallengeCard = memo(({
  challenge,
  onJoin,
  onLeave,
  isLoading = false
}: ChallengeCardProps) => {
  const defaultImage = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop";

  const isActive = () => {
    const now = new Date();
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    return now >= start && now <= end;
  };

  const isUpcoming = () => {
    const now = new Date();
    const start = new Date(challenge.start_date);
    return now < start;
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const end = new Date(challenge.end_date);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getTypeIcon = () => {
    switch (challenge.challenge_type) {
      case 'workout_count':
        return <Activity className="h-4 w-4" />;
      case 'total_volume':
        return <TrendingUp className="h-4 w-4" />;
      case 'total_calories':
        return <Flame className="h-4 w-4" />;
      case 'streak':
        return <Zap className="h-4 w-4" />;
      case 'specific_exercise':
        return <Target className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (challenge.challenge_type) {
      case 'workout_count':
        return 'Workout Count';
      case 'total_volume':
        return 'Total Volume';
      case 'total_calories':
        return 'Total Calories';
      case 'streak':
        return 'Streak';
      case 'specific_exercise':
        return challenge.exercise_name || 'Exercise';
      default:
        return 'Challenge';
    }
  };

  const getGoalText = () => {
    switch (challenge.challenge_type) {
      case 'workout_count':
        return `${challenge.goal_value} workouts`;
      case 'total_volume':
        return `${challenge.goal_value.toLocaleString()} kg`;
      case 'total_calories':
        return `${challenge.goal_value.toLocaleString()} calories`;
      case 'streak':
        return `${challenge.goal_value} days`;
      case 'specific_exercise':
        return `${challenge.goal_value} reps`;
      default:
        return challenge.goal_value.toString();
    }
  };

  const progressPercentage = challenge.user_participation
    ? Math.min(100, (challenge.user_participation.current_progress / challenge.goal_value) * 100)
    : 0;

  const isParticipating = !!challenge.user_participation;
  const isCompleted = challenge.user_participation?.completed || false;

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow">
      {/* Global badge */}
      {challenge.is_global && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
            Global Challenge
          </Badge>
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        {isCompleted ? (
          <Badge className="bg-green-500 text-white text-xs">
            Completed
          </Badge>
        ) : isActive() ? (
          <Badge className="bg-blue-500 text-white text-xs">
            Active
          </Badge>
        ) : isUpcoming() ? (
          <Badge className="bg-orange-500 text-white text-xs">
            Upcoming
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Ended
          </Badge>
        )}
      </div>

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={challenge.image_url || defaultImage}
          alt={challenge.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Title on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-bold text-xl text-white leading-tight">
            {challenge.title}
          </h3>
        </div>
      </div>

      <div className="p-4">
        {/* Description */}
        {challenge.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {challenge.description}
          </p>
        )}

        {/* Challenge details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              {getTypeIcon()}
              <span className="ml-2">{getTypeLabel()}</span>
            </div>
            <span className="font-semibold text-gray-900">
              Goal: {getGoalText()}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>{challenge.participant_count} participants</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{getDaysRemaining()} days left</span>
            </div>
          </div>
        </div>

        {/* Progress (if participating) */}
        {isParticipating && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Your Progress</span>
              <span className="font-semibold">
                {challenge.user_participation?.current_progress || 0} / {challenge.goal_value}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {progressPercentage.toFixed(0)}% complete
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-2">
          <Link to={`/challenges/${challenge.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>

          {isActive() && !isCompleted && (
            <>
              {isParticipating ? (
                <Button
                  variant="destructive"
                  onClick={onLeave}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Leave
                </Button>
              ) : (
                <Button
                  onClick={onJoin}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Join Challenge
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
});

ChallengeCard.displayName = "ChallengeCard";

export { ChallengeCard };

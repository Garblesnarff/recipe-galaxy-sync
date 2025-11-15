import { memo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Trophy,
  Award,
  PlayCircle,
  CheckCircle,
  Heart,
  MessageCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Activity } from "@/services/social/activityFeed";

interface ActivityFeedItemProps {
  activity: Activity;
  onLike?: () => void;
  onComment?: () => void;
  isLiked?: boolean;
  likeCount?: number;
  commentCount?: number;
}

const ActivityFeedItem = memo(({
  activity,
  onLike,
  onComment,
  isLiked = false,
  likeCount = 0,
  commentCount = 0,
}: ActivityFeedItemProps) => {
  const getInitials = (name?: string, username?: string) => {
    if (name) {
      return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return username?.substring(0, 2).toUpperCase() || "??";
  };

  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case "workout_completed":
        return <Dumbbell className="h-5 w-5 text-blue-600" />;
      case "pr_achieved":
        return <Trophy className="h-5 w-5 text-yellow-600" />;
      case "achievement_unlocked":
        return <Award className="h-5 w-5 text-purple-600" />;
      case "program_started":
        return <PlayCircle className="h-5 w-5 text-green-600" />;
      case "program_completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Dumbbell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityTitle = () => {
    const profile = activity.user_profile;
    const displayName = profile?.display_name || profile?.username || "Someone";

    switch (activity.activity_type) {
      case "workout_completed":
        return (
          <span>
            <strong>{displayName}</strong> completed a workout
          </span>
        );
      case "pr_achieved":
        return (
          <span>
            <strong>{displayName}</strong> achieved a new personal record!
          </span>
        );
      case "achievement_unlocked":
        return (
          <span>
            <strong>{displayName}</strong> unlocked an achievement
          </span>
        );
      case "program_started":
        return (
          <span>
            <strong>{displayName}</strong> started a new program
          </span>
        );
      case "program_completed":
        return (
          <span>
            <strong>{displayName}</strong> completed a program
          </span>
        );
      default:
        return (
          <span>
            <strong>{displayName}</strong> had activity
          </span>
        );
    }
  };

  const getActivityDetails = () => {
    const metadata = activity.metadata;

    switch (activity.activity_type) {
      case "workout_completed":
        return (
          <div className="mt-2">
            <p className="font-semibold text-lg">{metadata.workout_name}</p>
            {metadata.duration_minutes && (
              <p className="text-sm text-gray-600">
                Duration: {metadata.duration_minutes} minutes
              </p>
            )}
          </div>
        );
      case "pr_achieved":
        return (
          <div className="mt-2">
            <p className="font-semibold text-lg">{metadata.exercise_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                New PR: {metadata.pr_value} {metadata.pr_unit}
              </Badge>
            </div>
          </div>
        );
      case "achievement_unlocked":
        return (
          <div className="mt-2">
            <p className="font-semibold text-lg">{metadata.achievement_name}</p>
            {metadata.achievement_description && (
              <p className="text-sm text-gray-600">{metadata.achievement_description}</p>
            )}
          </div>
        );
      case "program_started":
      case "program_completed":
        return (
          <div className="mt-2">
            <p className="font-semibold text-lg">{metadata.program_name}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link to={`/profile/${activity.user_profile?.username || activity.user_id}`}>
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={activity.user_profile?.avatar_url}
              alt={activity.user_profile?.username}
            />
            <AvatarFallback>
              {getInitials(
                activity.user_profile?.display_name,
                activity.user_profile?.username
              )}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with Icon */}
          <div className="flex items-center gap-2 mb-1">
            {getActivityIcon()}
            <p className="text-sm text-gray-700">{getActivityTitle()}</p>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </p>

          {/* Activity Details */}
          {getActivityDetails()}

          {/* Actions */}
          {(onLike || onComment) && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
              {onLike && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLike}
                  className={isLiked ? "text-red-600" : ""}
                >
                  <Heart
                    className={`h-4 w-4 mr-1 ${isLiked ? "fill-red-600" : ""}`}
                  />
                  {likeCount > 0 && <span>{likeCount}</span>}
                </Button>
              )}

              {onComment && (
                <Button variant="ghost" size="sm" onClick={onComment}>
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {commentCount > 0 && <span>{commentCount}</span>}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

ActivityFeedItem.displayName = "ActivityFeedItem";

export { ActivityFeedItem };

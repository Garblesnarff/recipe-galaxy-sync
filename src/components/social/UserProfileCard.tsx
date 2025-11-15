import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Users, Dumbbell, UserPlus, UserMinus, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import type { UserProfile } from "@/services/social/userProfiles";

interface UserProfileCardProps {
  profile: UserProfile;
  stats?: {
    followers: number;
    following: number;
    workouts: number;
  };
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  onFollowToggle?: () => void;
  variant?: "default" | "compact";
}

const UserProfileCard = memo(({
  profile,
  stats,
  isFollowing = false,
  isOwnProfile = false,
  onFollowToggle,
  variant = "default",
}: UserProfileCardProps) => {
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

  if (variant === "compact") {
    return (
      <Link to={`/profile/${profile.username}`}>
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url} alt={profile.username} />
            <AvatarFallback>
              {getInitials(profile.display_name, profile.username)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">
                {profile.display_name || profile.username}
              </p>
              {!profile.is_public && (
                <Lock className="h-3 w-3 text-gray-400" />
              )}
            </div>
            <p className="text-xs text-gray-500">@{profile.username}</p>
          </div>

          {!isOwnProfile && onFollowToggle && (
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFollowToggle();
              }}
            >
              {isFollowing ? (
                <>
                  <UserMinus className="h-3 w-3 mr-1" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header Background */}
      <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600" />

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="flex justify-between items-start -mt-12 mb-4">
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            <AvatarImage src={profile.avatar_url} alt={profile.username} />
            <AvatarFallback className="bg-gray-200 text-gray-700 text-xl">
              {getInitials(profile.display_name, profile.username)}
            </AvatarFallback>
          </Avatar>

          {/* Action Button */}
          {!isOwnProfile && onFollowToggle && (
            <Button
              variant={isFollowing ? "outline" : "default"}
              onClick={onFollowToggle}
              className="mt-14"
            >
              {isFollowing ? (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
          )}

          {isOwnProfile && (
            <Link to="/settings/profile">
              <Button variant="outline" className="mt-14">
                Edit Profile
              </Button>
            </Link>
          )}
        </div>

        {/* Name and Username */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">
              {profile.display_name || profile.username}
            </h2>
            {!profile.is_public && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
          <p className="text-gray-500">@{profile.username}</p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-gray-700 mb-4">{profile.bio}</p>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <Link to={`/profile/${profile.username}/workouts`}>
              <div className="text-center hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <div className="flex items-center justify-center mb-1">
                  <Dumbbell className="h-4 w-4 text-gray-500 mr-1" />
                  <p className="text-2xl font-bold">{stats.workouts}</p>
                </div>
                <p className="text-xs text-gray-500">Workouts</p>
              </div>
            </Link>

            <Link to={`/profile/${profile.username}/followers`}>
              <div className="text-center hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-4 w-4 text-gray-500 mr-1" />
                  <p className="text-2xl font-bold">{stats.followers}</p>
                </div>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
            </Link>

            <Link to={`/profile/${profile.username}/following`}>
              <div className="text-center hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <div className="flex items-center justify-center mb-1">
                  <User className="h-4 w-4 text-gray-500 mr-1" />
                  <p className="text-2xl font-bold">{stats.following}</p>
                </div>
                <p className="text-xs text-gray-500">Following</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
});

UserProfileCard.displayName = "UserProfileCard";

export { UserProfileCard };

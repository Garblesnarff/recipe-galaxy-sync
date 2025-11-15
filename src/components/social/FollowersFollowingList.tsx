import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserProfileCard } from "./UserProfileCard";
import { Search, Users, UserPlus } from "lucide-react";
import type { UserProfile } from "@/services/social/userProfiles";

interface FollowersFollowingListProps {
  users: UserProfile[];
  title: string;
  currentUserId?: string;
  followingStatus?: Record<string, boolean>;
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function FollowersFollowingList({
  users,
  title,
  currentUserId,
  followingStatus = {},
  onFollowToggle,
  emptyMessage = "No users found",
  isLoading = false,
}: FollowersFollowingListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-bold">{title}</h2>
          <span className="text-sm text-gray-500">({users.length})</span>
        </div>
      </div>

      {/* Search */}
      {users.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Users List */}
      {filteredUsers.length > 0 ? (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <UserProfileCard
              key={user.id}
              profile={user}
              variant="compact"
              isOwnProfile={user.user_id === currentUserId}
              isFollowing={followingStatus[user.user_id] || false}
              onFollowToggle={
                onFollowToggle && user.user_id !== currentUserId
                  ? () =>
                      onFollowToggle(
                        user.user_id,
                        followingStatus[user.user_id] || false
                      )
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium mb-1">No results found</p>
                <p className="text-sm text-gray-500">
                  Try adjusting your search query
                </p>
              </>
            ) : (
              <>
                <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium mb-1">{emptyMessage}</p>
                <p className="text-sm text-gray-500">
                  Start following others to build your network
                </p>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

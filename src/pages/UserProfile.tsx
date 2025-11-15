import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { UserProfileCard } from '@/components/social/UserProfileCard';
import { ActivityFeedItem } from '@/components/social/ActivityFeedItem';
import { FollowersFollowingList } from '@/components/social/FollowersFollowingList';
import { WorkoutCard } from '@/components/workout/WorkoutCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, Dumbbell, Users, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocial } from '@/hooks/useSocial';
import { toast } from 'sonner';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('activity');

  const {
    profile,
    stats,
    activities,
    followers,
    following,
    workouts,
    isFollowing,
    loading,
    followUser,
    unfollowUser,
    loadUserProfile,
    loadUserStats,
    loadUserActivity,
    loadFollowers,
    loadFollowing,
    loadUserWorkouts,
  } = useSocial();

  const isOwnProfile = user?.id === profile?.user_id;

  useEffect(() => {
    if (username) {
      loadUserProfile(username);
      loadUserStats(username);
    }
  }, [username]);

  useEffect(() => {
    if (!profile) return;

    if (activeTab === 'activity') {
      loadUserActivity(profile.user_id);
    } else if (activeTab === 'workouts') {
      loadUserWorkouts(profile.user_id);
    } else if (activeTab === 'followers') {
      loadFollowers(profile.user_id);
    } else if (activeTab === 'following') {
      loadFollowing(profile.user_id);
    }
  }, [activeTab, profile]);

  const handleFollowToggle = async () => {
    if (!profile || !user) return;

    try {
      if (isFollowing) {
        await unfollowUser(profile.user_id);
        toast.success(`Unfollowed @${profile.username}`);
      } else {
        await followUser(profile.user_id);
        toast.success(`Following @${profile.username}`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  if (loading && !profile) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64" />
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
            <p className="text-gray-600 mb-6">
              The user @{username} does not exist or has been removed.
            </p>
            <Button onClick={() => navigate('/social')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Social
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <UserProfileCard
          profile={profile}
          stats={stats}
          isFollowing={isFollowing}
          isOwnProfile={isOwnProfile}
          onFollowToggle={user ? handleFollowToggle : undefined}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="workouts">
              <Dumbbell className="h-4 w-4 mr-2" />
              Workouts
            </TabsTrigger>
            <TabsTrigger value="followers">
              <Users className="h-4 w-4 mr-2" />
              Followers
            </TabsTrigger>
            <TabsTrigger value="following">
              <User className="h-4 w-4 mr-2" />
              Following
            </TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            {loading && activities.length === 0 ? (
              <div className="space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <ActivityFeedItem key={activity.id} activity={activity} />
              ))
            ) : (
              <Card className="p-12 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                <p className="text-gray-600">
                  {isOwnProfile
                    ? 'Start working out to see your activity here!'
                    : `@${profile.username} hasn't posted any activity yet.`}
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts" className="space-y-4">
            {loading && workouts.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            ) : workouts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workouts.map((workout: any) => (
                  <WorkoutCard
                    key={workout.id}
                    id={workout.id}
                    title={workout.name}
                    description={workout.description || 'No description'}
                    duration_minutes={workout.duration_minutes}
                    target_muscle_groups={workout.target_muscle_groups || []}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
                <p className="text-gray-600">
                  {isOwnProfile
                    ? 'Create your first workout to get started!'
                    : `@${profile.username} hasn't shared any workouts yet.`}
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Followers Tab */}
          <TabsContent value="followers">
            <FollowersFollowingList
              users={followers}
              title="Followers"
              currentUserId={user?.id}
              isLoading={loading}
              emptyMessage={
                isOwnProfile
                  ? 'You have no followers yet'
                  : `@${profile.username} has no followers yet`
              }
            />
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following">
            <FollowersFollowingList
              users={following}
              title="Following"
              currentUserId={user?.id}
              isLoading={loading}
              emptyMessage={
                isOwnProfile
                  ? "You're not following anyone yet"
                  : `@${profile.username} isn't following anyone yet`
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ActivityFeedItem } from '@/components/social/ActivityFeedItem';
import { UserProfileCard } from '@/components/social/UserProfileCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Users,
  Search,
  Filter,
  RefreshCw,
  UserPlus,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocial } from '@/hooks/useSocial';
import { toast } from 'sonner';
import type { ActivityType } from '@/services/social/activityFeed';

export default function SocialFeed() {
  const { user } = useAuth();
  const {
    feed,
    suggestedUsers,
    loading,
    loadFeed,
    loadFeedByType,
    loadSuggestedUsers,
    followUser,
    refreshFeed,
  } = useSocial();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadFeed();
      loadSuggestedUsers();
    }
  }, [user]);

  const handleFilterChange = (filter: string) => {
    setActiveTab(filter);
    if (filter === 'all') {
      loadFeed();
    } else {
      loadFeedByType(filter as ActivityType);
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await followUser(userId);
      toast.success('Following user!');
      loadSuggestedUsers();
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const handleRefresh = () => {
    refreshFeed();
    loadSuggestedUsers();
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Sign in to view social feed</h2>
            <p className="text-gray-600">
              Connect with other fitness enthusiasts and track their progress.
            </p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Activity className="h-8 w-8 text-blue-600" />
                  Social Feed
                </h1>
                <p className="text-gray-600 mt-1">
                  See what your friends are up to
                </p>
              </div>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Tabs value={activeTab} onValueChange={handleFilterChange}>
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">
                    <Filter className="h-4 w-4 mr-2" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="workout_completed" className="flex-1">
                    Workouts
                  </TabsTrigger>
                  <TabsTrigger value="pr_achieved" className="flex-1">
                    PRs
                  </TabsTrigger>
                  <TabsTrigger value="achievement_unlocked" className="flex-1">
                    Achievements
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6 space-y-4">
                  {loading && feed.length === 0 ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                    </div>
                  ) : feed.length > 0 ? (
                    feed
                      .filter((activity) => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        const metadata = activity.metadata;
                        return (
                          activity.activity_type.toLowerCase().includes(query) ||
                          metadata.workout_name?.toLowerCase().includes(query) ||
                          metadata.exercise_name?.toLowerCase().includes(query) ||
                          metadata.achievement_name?.toLowerCase().includes(query) ||
                          metadata.program_name?.toLowerCase().includes(query) ||
                          activity.user_profile?.username?.toLowerCase().includes(query) ||
                          activity.user_profile?.display_name?.toLowerCase().includes(query)
                        );
                      })
                      .map((activity) => (
                        <ActivityFeedItem key={activity.id} activity={activity} />
                      ))
                  ) : (
                    <Card className="p-12 text-center">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                      <p className="text-gray-600 mb-4">
                        Follow other users to see their activity in your feed!
                      </p>
                      <Button onClick={() => setActiveTab('all')}>
                        View All Activity
                      </Button>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Suggested Users */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-bold">Suggested Users</h2>
              </div>

              {loading && suggestedUsers.length === 0 ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : suggestedUsers.length > 0 ? (
                <div className="space-y-2">
                  {suggestedUsers.slice(0, 5).map((suggestedUser) => (
                    <UserProfileCard
                      key={suggestedUser.id}
                      profile={suggestedUser}
                      variant="compact"
                      onFollowToggle={() => handleFollowUser(suggestedUser.user_id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">
                  No suggestions available
                </p>
              )}
            </Card>

            {/* Trending Topics (Placeholder) */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-bold">Trending</h2>
              </div>

              <div className="space-y-3">
                <div className="hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors">
                  <p className="font-semibold text-sm">#MondayMotivation</p>
                  <p className="text-xs text-gray-500">156 posts</p>
                </div>
                <div className="hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors">
                  <p className="font-semibold text-sm">#LegDay</p>
                  <p className="text-xs text-gray-500">98 posts</p>
                </div>
                <div className="hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors">
                  <p className="font-semibold text-sm">#PersonalRecord</p>
                  <p className="text-xs text-gray-500">87 posts</p>
                </div>
                <div className="hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors">
                  <p className="font-semibold text-sm">#FitnessGoals</p>
                  <p className="text-xs text-gray-500">72 posts</p>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-bold">Your Network</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Following</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Followers</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Posts</span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

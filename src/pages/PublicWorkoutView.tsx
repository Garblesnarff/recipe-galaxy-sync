import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Copy,
  Eye,
  Clock,
  Calendar,
  Share2,
  Download,
  Lock,
  Dumbbell,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSharedWorkout, cloneSharedWorkout } from '@/services/social/workoutSharing';
import { getUserProfile } from '@/services/social/userProfiles';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function PublicWorkoutView() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<any>(null);
  const [workout, setWorkout] = useState<any>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    loadSharedWorkout();
  }, [shareCode]);

  const loadSharedWorkout = async () => {
    if (!shareCode) return;

    try {
      setLoading(true);
      const data = await getSharedWorkout(shareCode);
      setShare(data);
      setWorkout(data.workout);

      // Load owner profile
      if (data.shared_by_user_id) {
        const profile = await getUserProfile(data.shared_by_user_id);
        setOwnerProfile(profile);
      }
    } catch (error) {
      console.error('Error loading shared workout:', error);
      toast.error('Failed to load shared workout');
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async () => {
    if (!shareCode || !user) {
      toast.error('Please sign in to clone this workout');
      return;
    }

    try {
      setCloning(true);
      const clonedWorkout = await cloneSharedWorkout(shareCode, user.id);
      toast.success('Workout cloned successfully!');
      navigate(`/workout/${clonedWorkout.id}`);
    } catch (error) {
      console.error('Error cloning workout:', error);
      toast.error('Failed to clone workout');
    } finally {
      setCloning(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: workout?.name || 'Shared Workout',
          text: `Check out this workout: ${workout?.name}`,
          url: url,
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (!share || !workout) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Workout not found</h2>
            <p className="text-gray-600 mb-6">
              This workout may be private or no longer exists.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={share.is_public ? 'default' : 'secondary'}>
                    {share.is_public ? 'Public' : 'Private'}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {share.view_count || 0} views
                  </Badge>
                </div>
                <CardTitle className="text-3xl mb-2">{workout.name}</CardTitle>
                {workout.description && (
                  <p className="text-gray-600">{workout.description}</p>
                )}
              </div>
            </div>

            {/* Owner Info */}
            {ownerProfile && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={ownerProfile.avatar_url} />
                  <AvatarFallback>
                    {ownerProfile.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {ownerProfile.display_name || ownerProfile.username}
                  </p>
                  <p className="text-sm text-gray-500">@{ownerProfile.username}</p>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {user && (
                <Button onClick={handleClone} disabled={cloning}>
                  <Copy className="h-4 w-4 mr-2" />
                  {cloning ? 'Cloning...' : 'Clone to My Workouts'}
                </Button>
              )}
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {!user && (
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  Sign in to clone
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workout Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Workout Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {workout.duration_minutes && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold">{workout.duration_minutes} min</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-semibold">
                    {formatDistanceToNow(new Date(workout.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {workout.notes && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-gray-700">{workout.notes}</p>
              </div>
            )}

            {/* Exercises Section - Placeholder */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Exercises</h3>
              <p className="text-sm text-gray-500">
                Exercise details will be displayed here. This requires fetching
                workout exercises from the database.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share Info */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Share Code</p>
                <code className="text-lg font-mono font-semibold">
                  {share.share_code}
                </code>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Shared</p>
                <p className="font-semibold">
                  {formatDistanceToNow(new Date(share.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

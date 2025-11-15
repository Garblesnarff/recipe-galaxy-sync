import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainNav } from "@/components/layout/MainNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Target, Users, Trophy, TrendingUp, CheckCircle } from "lucide-react";
import { ChallengeLeaderboard } from "@/components/social/ChallengeLeaderboard";
import { getChallengeDetail, getChallengeLeaderboard, getChallengeStats, joinChallenge, leaveChallenge } from "@/services/social/challenges";
import type { ChallengeWithParticipants, ChallengeLeaderboardEntry } from "@/services/social/challenges";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ChallengeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<ChallengeWithParticipants | null>(null);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadChallengeData();
  }, [id]);

  const loadChallengeData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Load challenge details
      const challengeData = await getChallengeDetail(id, user?.id);
      setChallenge(challengeData);

      // Load leaderboard
      const leaderboardData = await getChallengeLeaderboard(id);
      setLeaderboard(leaderboardData);

      // Load stats
      const statsData = await getChallengeStats(id);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading challenge:", error);
      toast({
        title: "Error",
        description: "Failed to load challenge details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!userId || !id) return;

    try {
      setIsJoining(true);
      await joinChallenge(userId, id);
      await loadChallengeData();
      toast({
        title: "Joined!",
        description: "You've successfully joined this challenge"
      });
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast({
        title: "Error",
        description: "Failed to join challenge",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!userId || !id) return;

    try {
      setIsJoining(true);
      await leaveChallenge(userId, id);
      await loadChallengeData();
      toast({
        title: "Left",
        description: "You've left this challenge"
      });
    } catch (error) {
      console.error("Error leaving challenge:", error);
      toast({
        title: "Error",
        description: "Failed to leave challenge",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const isActive = () => {
    if (!challenge) return false;
    const now = new Date();
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    return now >= start && now <= end;
  };

  const getDaysRemaining = () => {
    if (!challenge) return 0;
    const now = new Date();
    const end = new Date(challenge.end_date);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getTypeLabel = () => {
    if (!challenge) return '';
    switch (challenge.challenge_type) {
      case 'workout_count':
        return 'Workout Count';
      case 'total_volume':
        return 'Total Volume';
      case 'total_calories':
        return 'Total Calories';
      case 'streak':
        return 'Streak Challenge';
      case 'specific_exercise':
        return challenge.exercise_name || 'Exercise Challenge';
      default:
        return 'Challenge';
    }
  };

  const getGoalText = () => {
    if (!challenge) return '';
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

  const progressPercentage = challenge?.user_participation
    ? Math.min(100, (challenge.user_participation.current_progress / challenge.goal_value) * 100)
    : 0;

  const isParticipating = !!challenge?.user_participation;
  const isCompleted = challenge?.user_participation?.completed || false;

  if (isLoading) {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!challenge) {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Challenge not found</h2>
          <Button onClick={() => navigate('/challenges')} className="mt-4">
            Back to Challenges
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNav />
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/challenges')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Challenges
        </Button>

        {/* Challenge Header */}
        <Card className="overflow-hidden">
          <div className="relative h-64 overflow-hidden">
            <img
              src={challenge.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop'}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-3 mb-3">
                {challenge.is_global && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Global Challenge
                  </Badge>
                )}
                {isCompleted && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold text-white">{challenge.title}</h1>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Description */}
            {challenge.description && (
              <p className="text-gray-700 text-lg">{challenge.description}</p>
            )}

            {/* Key stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-sm text-gray-600">Goal</div>
                <div className="font-bold text-lg">{getGoalText()}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-sm text-gray-600">Participants</div>
                <div className="font-bold text-lg">{challenge.participant_count}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-sm text-gray-600">Days Left</div>
                <div className="font-bold text-lg">{getDaysRemaining()}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="text-sm text-gray-600">Completion Rate</div>
                <div className="font-bold text-lg">{stats?.completion_rate.toFixed(0)}%</div>
              </div>
            </div>

            {/* User progress */}
            {isParticipating && (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-lg mb-4">Your Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">
                      {challenge.user_participation?.current_progress || 0} / {challenge.goal_value}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  <p className="text-sm text-gray-600">
                    {progressPercentage.toFixed(0)}% complete
                  </p>
                </div>
              </Card>
            )}

            {/* CTA buttons */}
            {isActive() && !isCompleted && (
              <div className="flex gap-3">
                {isParticipating ? (
                  <Button
                    variant="destructive"
                    onClick={handleLeave}
                    disabled={isJoining}
                    className="flex-1"
                  >
                    Leave Challenge
                  </Button>
                ) : (
                  <Button
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Join Challenge
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Leaderboard */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Leaderboard
          </h2>
          <ChallengeLeaderboard
            entries={leaderboard}
            goalValue={challenge.goal_value}
            currentUserId={userId || undefined}
            maxEntries={100}
          />
        </div>

        {/* Challenge Info */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Challenge Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-semibold">{getTypeLabel()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span className="font-semibold">{format(new Date(challenge.start_date), 'PPP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">End Date:</span>
              <span className="font-semibold">{format(new Date(challenge.end_date), 'PPP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Participants:</span>
              <span className="font-semibold">{stats?.total_participants || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-semibold">{stats?.completed_count || 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default ChallengeDetail;

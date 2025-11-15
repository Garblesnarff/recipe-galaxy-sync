import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainNav } from "@/components/layout/MainNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, TrendingUp } from "lucide-react";
import { LeaderboardTable } from "@/components/social/LeaderboardTable";
import { getLeaderboardsByPeriod } from "@/services/social/leaderboards";
import { supabase } from "@/integrations/supabase/client";
import type { Leaderboard, LeaderboardWithEntries } from "@/services/social/leaderboards";
import { useToast } from "@/hooks/use-toast";

const Leaderboards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timePeriod, setTimePeriod] = useState<Leaderboard['time_period']>('weekly');
  const [leaderboards, setLeaderboards] = useState<LeaderboardWithEntries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboards();
  }, [timePeriod]);

  const loadLeaderboards = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Load leaderboards
      const data = await getLeaderboardsByPeriod(timePeriod);
      setLeaderboards(data as LeaderboardWithEntries[]);
    } catch (error) {
      console.error("Error loading leaderboards:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboards",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimePeriodChange = (period: Leaderboard['time_period']) => {
    setTimePeriod(period);
  };

  if (isLoading) {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNav />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Leaderboards
            </h1>
            <p className="text-gray-600 mt-1">
              See how you rank against other fitness enthusiasts!
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/challenges")}>
              <Target className="mr-2 h-4 w-4" />
              Challenges
            </Button>
          </div>
        </div>

        {/* Time Period Tabs */}
        <Tabs value={timePeriod} onValueChange={(v) => handleTimePeriodChange(v as Leaderboard['time_period'])}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={timePeriod} className="mt-6 space-y-8">
            {leaderboards.length === 0 ? (
              <Card className="p-16 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No leaderboard data yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start working out to appear on the leaderboards!
                </p>
                <Button onClick={() => navigate("/workouts/add")} className="bg-blue-600 hover:bg-blue-700">
                  Log Your First Workout
                </Button>
              </Card>
            ) : (
              <>
                {leaderboards.map((leaderboard) => (
                  <LeaderboardTable
                    key={leaderboard.id}
                    leaderboardType={leaderboard.leaderboard_type}
                    timePeriod={leaderboard.time_period}
                    entries={leaderboard.entries}
                    currentUserId={userId || undefined}
                    showPagination={true}
                  />
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-start gap-4">
            <TrendingUp className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">How Rankings Work</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Rankings are updated automatically as you log workouts</li>
                <li>• Weekly leaderboards reset every Monday</li>
                <li>• Monthly leaderboards reset on the 1st of each month</li>
                <li>• All-time rankings track your lifetime performance</li>
                <li>• Volume is calculated as: Sets × Reps × Weight</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Leaderboards;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainNav } from "@/components/layout/MainNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trophy, TrendingUp } from "lucide-react";
import { ChallengeCard } from "@/components/social/ChallengeCard";
import { CreateChallengeDialog } from "@/components/social/CreateChallengeDialog";
import { useChallenges } from "@/hooks/useChallenges";
import type { ChallengeFilter } from "@/services/social/challenges";

const Challenges = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ChallengeFilter>('active');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    challenges,
    isLoading,
    joinChallenge,
    leaveChallenge,
    createChallenge,
    isJoining,
    isLeaving,
    isCreating
  } = useChallenges(activeTab);

  const handleJoinChallenge = async (challengeId: string) => {
    await joinChallenge(challengeId);
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    await leaveChallenge(challengeId);
  };

  const handleCreateChallenge = async (data: Parameters<typeof createChallenge>[0]) => {
    await createChallenge(data);
  };

  if (isLoading) {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-lg" />
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
              Challenges
            </h1>
            <p className="text-gray-600 mt-1">
              Join challenges to compete with others and push your limits!
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/leaderboards")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Leaderboards
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Challenge
            </Button>
          </div>
        </div>

        {/* Tabs for filtering */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ChallengeFilter)}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="my_challenges">My Challenges</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {challenges.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No {activeTab} challenges
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'my_challenges'
                    ? "You haven't created any challenges yet. Create one to get started!"
                    : "Check back later for new challenges or create your own!"}
                </p>
                {activeTab === 'my_challenges' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Challenge
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {challenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onJoin={() => handleJoinChallenge(challenge.id)}
                    onLeave={() => handleLeaveChallenge(challenge.id)}
                    isLoading={isJoining || isLeaving}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Challenge Dialog */}
      <CreateChallengeDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateChallenge={handleCreateChallenge}
        isLoading={isCreating}
      />
    </>
  );
};

export default Challenges;

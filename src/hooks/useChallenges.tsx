import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getChallenges,
  joinChallenge as joinChallengeService,
  leaveChallenge as leaveChallengeService,
  createChallenge as createChallengeService,
  type ChallengeFilter,
  type Challenge
} from "@/services/social/challenges";

export const useChallenges = (filter: ChallengeFilter = 'active') => {
  const queryClient = useQueryClient();

  // Get current user ID
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // Fetch challenges
  const {
    data: challenges = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['challenges', filter, user?.id],
    queryFn: () => getChallenges(user?.id, filter),
    enabled: !!user
  });

  // Join challenge mutation
  const joinMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user?.id) throw new Error("User must be logged in");
      return joinChallengeService(user.id, challengeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-detail'] });
      toast.success("Successfully joined challenge!");
    },
    onError: (error) => {
      console.error("Error joining challenge:", error);
      toast.error(error instanceof Error ? error.message : "Failed to join challenge");
    }
  });

  // Leave challenge mutation
  const leaveMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user?.id) throw new Error("User must be logged in");
      return leaveChallengeService(user.id, challengeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-detail'] });
      toast.success("You have left the challenge");
    },
    onError: (error) => {
      console.error("Error leaving challenge:", error);
      toast.error(error instanceof Error ? error.message : "Failed to leave challenge");
    }
  });

  // Create challenge mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      challenge_type: Challenge['challenge_type'];
      goal_value: number;
      start_date: string;
      end_date: string;
      exercise_name?: string;
      image_url?: string;
    }) => {
      if (!user?.id) throw new Error("User must be logged in");
      return createChallengeService(user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success("Challenge created successfully!");
    },
    onError: (error) => {
      console.error("Error creating challenge:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create challenge");
    }
  });

  return {
    challenges,
    isLoading,
    error,
    joinChallenge: joinMutation.mutateAsync,
    leaveChallenge: leaveMutation.mutateAsync,
    createChallenge: createMutation.mutateAsync,
    isJoining: joinMutation.isPending,
    isLeaving: leaveMutation.isPending,
    isCreating: createMutation.isPending
  };
};

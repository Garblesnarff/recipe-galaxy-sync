import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  analyzeFormWithAI,
  saveFormAnalysis,
  getFormAnalysis,
  getLatestAIAnalysis,
  compareVideos,
  getFormProgressOverTime,
  getAverageScoreForExercise,
} from "@/services/video/formAnalysis";
import {
  getUserVideos,
  getVideosByExercise,
  getPublicFormVideos,
  getVideoById,
  getRecentVideos,
  getUserVideoStats,
} from "@/services/video/videoLibrary";
import { toast } from "sonner";

/**
 * Hook for analyzing a video
 */
export function useFormAnalysis(videoId: string | null) {
  const queryClient = useQueryClient();

  // Fetch all analyses for a video
  const { data: analyses, isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ["form-analysis", videoId],
    queryFn: () => getFormAnalysis(videoId!),
    enabled: !!videoId,
  });

  // Fetch latest AI analysis
  const { data: latestAnalysis, isLoading: isLoadingLatest } = useQuery({
    queryKey: ["latest-analysis", videoId],
    queryFn: () => getLatestAIAnalysis(videoId!),
    enabled: !!videoId,
  });

  // Analyze video with AI
  const analyzeVideoMutation = useMutation({
    mutationFn: async ({ videoId, exerciseName }: { videoId: string; exerciseName: string }) => {
      // Run AI analysis
      const result = await analyzeFormWithAI(videoId, exerciseName);

      // Save analysis to database
      await saveFormAnalysis(videoId, result, "ai_generated");

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-analysis", videoId] });
      queryClient.invalidateQueries({ queryKey: ["latest-analysis", videoId] });
      queryClient.invalidateQueries({ queryKey: ["user-videos"] });
      queryClient.invalidateQueries({ queryKey: ["exercise-videos"] });
      toast.success("Form analysis completed!");
    },
    onError: (error) => {
      console.error("Error analyzing video:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze video");
    },
  });

  return {
    analyses,
    latestAnalysis,
    isLoadingAnalyses,
    isLoadingLatest,
    analyzeVideo: analyzeVideoMutation.mutate,
    isAnalyzing: analyzeVideoMutation.isPending,
  };
}

/**
 * Hook for fetching user's videos
 */
export function useUserVideos(userId: string | null, options?: {
  limit?: number;
  sortBy?: "recorded_at" | "created_at";
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["user-videos", userId, options],
    queryFn: () => getUserVideos(userId!, options),
    enabled: !!userId,
  });
}

/**
 * Hook for fetching videos by exercise
 */
export function useExerciseVideos(
  userId: string | null,
  exerciseName: string | null,
  includePublic: boolean = false
) {
  return useQuery({
    queryKey: ["exercise-videos", userId, exerciseName, includePublic],
    queryFn: () => getVideosByExercise(userId!, exerciseName!, { includePublic }),
    enabled: !!userId && !!exerciseName,
  });
}

/**
 * Hook for fetching public example videos
 */
export function usePublicVideos(exerciseName?: string, minScore: number = 80) {
  return useQuery({
    queryKey: ["public-videos", exerciseName, minScore],
    queryFn: () => getPublicFormVideos(exerciseName, { minScore, limit: 10 }),
  });
}

/**
 * Hook for fetching a single video
 */
export function useVideo(videoId: string | null) {
  return useQuery({
    queryKey: ["video", videoId],
    queryFn: () => getVideoById(videoId!),
    enabled: !!videoId,
  });
}

/**
 * Hook for fetching recent videos
 */
export function useRecentVideos(userId: string | null, limit: number = 10) {
  return useQuery({
    queryKey: ["recent-videos", userId, limit],
    queryFn: () => getRecentVideos(userId!, limit),
    enabled: !!userId,
  });
}

/**
 * Hook for comparing two videos
 */
export function useVideoComparison(videoId1: string | null, videoId2: string | null) {
  return useQuery({
    queryKey: ["video-comparison", videoId1, videoId2],
    queryFn: () => compareVideos(videoId1!, videoId2!),
    enabled: !!videoId1 && !!videoId2,
  });
}

/**
 * Hook for form progress tracking
 */
export function useFormProgress(userId: string | null, exerciseName: string | null) {
  const queryClient = useQueryClient();

  // Get progress over time
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["form-progress", userId, exerciseName],
    queryFn: () => getFormProgressOverTime(userId!, exerciseName!),
    enabled: !!userId && !!exerciseName,
  });

  // Get average score
  const { data: averageScore, isLoading: isLoadingAverage } = useQuery({
    queryKey: ["average-score", userId, exerciseName],
    queryFn: () => getAverageScoreForExercise(userId!, exerciseName!),
    enabled: !!userId && !!exerciseName,
  });

  return {
    progressData,
    averageScore,
    isLoading: isLoadingProgress || isLoadingAverage,
  };
}

/**
 * Hook for user video statistics
 */
export function useVideoStats(userId: string | null) {
  return useQuery({
    queryKey: ["video-stats", userId],
    queryFn: () => getUserVideoStats(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook for deleting a video
 */
export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      const { deleteVideo } = await import("@/services/video/videoRecording");
      await deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-videos"] });
      queryClient.invalidateQueries({ queryKey: ["exercise-videos"] });
      queryClient.invalidateQueries({ queryKey: ["recent-videos"] });
      queryClient.invalidateQueries({ queryKey: ["video-stats"] });
      toast.success("Video deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting video:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete video");
    },
  });
}

/**
 * Hook for marking video as example
 */
export function useMarkVideoAsExample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, isExample }: { videoId: string; isExample: boolean }) => {
      const { markVideoAsExample } = await import("@/services/video/videoLibrary");
      await markVideoAsExample(videoId, isExample);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-videos"] });
      queryClient.invalidateQueries({ queryKey: ["public-videos"] });
      queryClient.invalidateQueries({ queryKey: ["video"] });
      toast.success("Video visibility updated");
    },
    onError: (error) => {
      console.error("Error updating video visibility:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update video");
    },
  });
}
